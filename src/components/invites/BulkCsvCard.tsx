'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  Users,
  Send,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useRatingPulseStore } from '@/lib/store';

export interface ParsedContact {
  name: string;
  phone: string;
  email?: string;
  isValid: boolean;
}

interface BulkCsvCardProps {
  onBulkProcessed?: () => void;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ''));
  return result;
}

export default function BulkCsvCard({ onBulkProcessed }: BulkCsvCardProps) {
  const { activeBusiness } = useRatingPulseStore();
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [contacts, setContacts] = useState<ParsedContact[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleCsvContent = `name,phone,email\nSarah Jenkins,(555) 234-5678,sarah@example.com\nMichael Chang,(555) 345-6789,mchang@example.com\nEmma Watson,(555) 456-7890,emma@example.com\nDavid Miller,(555) 567-8901,david@example.com\nSophia Rodriguez,(555) 678-9012,sophia@example.com`;

  const handleDownloadSample = (e: React.MouseEvent) => {
    e.preventDefault();
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ratingpulse_sample_contacts.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Sample template downloaded!');
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Invalid file type', { description: 'Please upload a valid .csv spreadsheet file.' });
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        toast.error('CSV file is empty.');
        return;
      }

      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        toast.error('CSV contains no data rows.');
        return;
      }

      const headerLine = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z]/g, ''));
      
      let nameIndex = headerLine.findIndex((h) => h.includes('name'));
      let phoneIndex = headerLine.findIndex((h) => h.includes('phone') || h.includes('mobile') || h.includes('cell') || h.includes('tel'));
      let emailIndex = headerLine.findIndex((h) => h.includes('email') || h.includes('mail'));

      // Fallbacks if standard headers not found
      if (nameIndex === -1) nameIndex = 0;
      if (phoneIndex === -1) phoneIndex = 1;
      if (emailIndex === -1 && headerLine.length > 2) emailIndex = 2;

      const parsed: ParsedContact[] = [];

      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        if (row.length === 0 || (row.length === 1 && !row[0])) continue;

        const name = row[nameIndex] || `Customer #${i}`;
        const phone = row[phoneIndex] || '';
        const email = emailIndex !== -1 ? row[emailIndex] : undefined;
        
        const cleanPhone = phone.replace(/\D/g, '');
        const isValid = cleanPhone.length >= 10;

        parsed.push({
          name: name.trim(),
          phone: phone.trim(),
          email: email?.trim(),
          isValid,
        });
      }

      setContacts(parsed);
      const validCount = parsed.filter((c) => c.isValid).length;
      toast.success(`Parsed ${parsed.length} contacts (${validCount} valid phone numbers).`);
    };

    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleQueueAll = async () => {
    const valid = contacts.filter((c) => c.isValid);
    if (valid.length === 0) {
      toast.error('No valid contacts to queue.');
      return;
    }

    setIsProcessing(true);
    try {
      const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
      const res = await fetch('/api/invites/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts: valid,
          timeZone: userTz,
          businessName: activeBusiness.name,
          placeId: activeBusiness.placeId,
          reviewLink: activeBusiness.reviewUrl,
          isDemoMode: activeBusiness.isDemoMode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch bulk invites');
      }

      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#10b981', '#06b6d4'],
        });
      } catch {
        // ignore
      }

      if (data.status === 'QUEUED_FOR_DAYLIGHT') {
        toast.info(`Queued ${data.queuedCount} Invites for Daylight Delivery`, {
          description: 'TCPA quiet hours active. Messages will dispatch automatically at 8:00 AM tomorrow.',
        });
      } else {
        toast.success(`Successfully Dispatched ${data.queuedCount} Review Invites!`, {
          description: 'SMS review requests sent with Google review links.',
        });
      }

      setContacts([]);
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onBulkProcessed) onBulkProcessed();
    } catch (err: any) {
      toast.error('Bulk Dispatch Error', { description: err?.message || 'Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setContacts([]);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validCount = contacts.filter((c) => c.isValid).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            <span>Bulk CSV Campaign</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Import a customer list from your POS or CRM to dispatch review invites in bulk.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadSample}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Sample CSV</span>
        </button>
      </div>

      {contacts.length === 0 ? (
        /* Drag and Drop Zone */
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-indigo-600 bg-indigo-50/60 scale-[1.01]'
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mx-auto mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            Click to upload or drag &amp; drop CSV
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Upload CSV with columns: <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] text-slate-800">name</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] text-slate-800">phone</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] text-slate-800">email</code>
          </p>
        </div>
      ) : (
        /* Parsed Contacts Preview & Action Bar */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">{fileName}</div>
                <div className="text-[11px] text-slate-500">
                  {contacts.length} Total Contacts • <span className="text-emerald-600 font-bold">{validCount} Valid Numbers</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClear}
                disabled={isProcessing}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>

              <button
                type="button"
                onClick={handleQueueAll}
                disabled={isProcessing || validCount === 0}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>Processing batch...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Queue All ({validCount} contacts)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Table Preview (Max 10 rows) */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Phone</th>
                  <th className="px-4 py-2.5">Email</th>
                  <th className="px-4 py-2.5">Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {contacts.slice(0, 10).map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 font-semibold text-slate-900">{c.name}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-600">{c.phone || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-500">{c.email || '—'}</td>
                    <td className="px-4 py-2.5">
                      {c.isValid ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          Invalid Phone
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {contacts.length > 10 && (
            <p className="text-[11px] text-slate-500 text-center font-medium">
              Showing first 10 of {contacts.length} parsed contacts. All {validCount} valid entries will be queued.
            </p>
          )}
        </div>
      )}

    </div>
  );
}
