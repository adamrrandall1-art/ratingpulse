import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0B0F19',
          borderRadius: 8,
          border: '1.5px solid #00e676',
        }}
      >
        <svg
          viewBox="0 0 100 100"
          style={{ width: '80%', height: '80%' }}
          fill="none"
        >
          <rect x="16" y="16" width="13" height="68" rx="6.5" fill="#00e676" />
          <path
            d="M 22 16 L 52 16 C 68 16 68 46 52 46 L 22 46"
            stroke="#00e676"
            strokeWidth="13"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 38 46 L 46 80 L 60 22 L 72 80 L 86 48 L 92 48"
            stroke="#00e676"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="92" cy="48" r="4" fill="#00e676" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
