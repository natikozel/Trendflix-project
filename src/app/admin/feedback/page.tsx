import FeedbackDashboard from '@/components/admin/FeedbackDashboard';

export const metadata = {
  title: 'Recommendation Feedback Dashboard | Trendflix Admin',
  description: 'Monitor and analyze user feedback on movie recommendations.',
};

export default function FeedbackAdminPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <FeedbackDashboard />
      </div>
    </main>
  );
} 