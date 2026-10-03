import { redirect } from 'next/navigation';

export default function FeedbackRedirectPage() {
  redirect('/dashboard/reviews?tab=private');
}

