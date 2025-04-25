'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Filter } from 'lucide-react';
import { getAllFeedback } from '@/app/actions/feedback';
import RecommendationFeedback from '@/lib/db/models/RecommendationFeedback';

interface FeedbackItem extends RecommendationFeedback {
  movieName?: string;
}

const FeedbackDashboard = () => {
  const [feedbackData, setFeedbackData] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLiked, setShowLiked] = useState(true);
  const [showDisliked, setShowDisliked] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setIsLoading(true);
        // Use the server action instead of a fetch call
        const data = await getAllFeedback();
        setFeedbackData(data as FeedbackItem[]);
      } catch (error) {
        console.error('Error fetching feedback:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFeedback();
  }, []);

  const filteredFeedback = feedbackData.filter(item => {
    if (showLiked && item.liked) return true;
    if (showDisliked && !item.liked) return true;
    return false;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const likedCount = feedbackData.filter(item => item.liked).length;
  const dislikedCount = feedbackData.filter(item => !item.liked).length;
  const likeRatio = feedbackData.length > 0 
    ? Math.round((likedCount / feedbackData.length) * 100) 
    : 0;

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6">Recommendation Feedback Dashboard</h2>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-sm text-gray-400">Total Feedback</p>
          <p className="text-2xl font-bold">{feedbackData.length}</p>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-sm text-gray-400">Liked</p>
          <div className="flex items-center gap-2">
            <ThumbsUp className="text-green-400" size={16} />
            <p className="text-2xl font-bold">{likedCount}</p>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-sm text-gray-400">Disliked</p>
          <div className="flex items-center gap-2">
            <ThumbsDown className="text-red-400" size={16} />
            <p className="text-2xl font-bold">{dislikedCount}</p>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-sm text-gray-400">Like Ratio</p>
          <p className="text-2xl font-bold">{likeRatio}%</p>
          <div className="h-2 bg-gray-700 rounded-full mt-2">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              style={{ width: `${likeRatio}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-gray-800 rounded-lg">
        <Filter size={18} className="text-gray-400" />
        <span className="text-sm font-medium">Filters:</span>
        
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showLiked}
            onChange={() => setShowLiked(!showLiked)}
            className="rounded border-gray-600 text-blue-500 focus:ring-blue-500/20"
          />
          <ThumbsUp size={16} className="text-green-400" />
          Liked
        </label>
        
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showDisliked}
            onChange={() => setShowDisliked(!showDisliked)}
            className="rounded border-gray-600 text-blue-500 focus:ring-blue-500/20"
          />
          <ThumbsDown size={16} className="text-red-400" />
          Disliked
        </label>
      </div>
      
      {/* Feedback Table */}
      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <>
          {filteredFeedback.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No feedback data available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-800 text-left">
                    <th className="p-3 text-sm font-medium text-gray-300">Movie ID</th>
                    <th className="p-3 text-sm font-medium text-gray-300">Feedback</th>
                    <th className="p-3 text-sm font-medium text-gray-300">Match Score</th>
                    <th className="p-3 text-sm font-medium text-gray-300">Time</th>
                    <th className="p-3 text-sm font-medium text-gray-300">User Input</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeedback.map((item) => (
                    <tr key={item.id} className="border-t border-gray-700 hover:bg-gray-800/50">
                      <td className="p-3 text-sm">{item.movieId}</td>
                      <td className="p-3">
                        {item.liked ? (
                          <div className="flex items-center gap-1 text-green-400">
                            <ThumbsUp size={16} />
                            <span className="text-sm">Liked</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-400">
                            <ThumbsDown size={16} />
                            <span className="text-sm">Disliked</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-sm">
                        {item.recommendationScore 
                          ? parseFloat(item.recommendationScore.toString()).toFixed(4)
                          : 'N/A'
                        }
                      </td>
                      <td className="p-3 text-sm text-gray-400">{formatDate(item.timestamp)}</td>
                      <td className="p-3 text-sm">
                        <details className="cursor-pointer">
                          <summary className="text-blue-400 hover:text-blue-300">View Input Data</summary>
                          <pre className="mt-2 p-2 bg-gray-800 rounded text-xs overflow-x-auto">
                            {JSON.stringify(item.userInputData, null, 2)}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FeedbackDashboard; 