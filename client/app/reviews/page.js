import ReviewsSection from '@/components/ReviewsSection';

export const metadata = {
  title: 'User Reviews - Garde',
  description: 'Read what our users are saying about Garde - AI-powered recipe and guide extraction',
  openGraph: {
    title: 'User Reviews - Garde',
    description: 'See what our community thinks about Garde',
  }
};

export default function ReviewsPage() {
  return <ReviewsSection />;
}
