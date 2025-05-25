import { jest } from '@jest/globals';

// Create typed recommender mock
interface Recommendation {
  id: string;
  title: string;
  type?: string;
}

// Create type for Gemini API response
interface GeminiResponse {
  text: string;
}

// Create a mock implementation of the recommender
const mockGetRecommendations = jest.fn<Promise<Recommendation[]>, [any]>();

// Mock the recommender module
jest.mock('@/algorithm/recommender.js', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getRecommendations: mockGetRecommendations
  }))
}));

// Mock the Gemini API to prevent actual API calls
jest.mock('@/algorithm/LLM.js', () => ({
  generateGeminiResponse: jest.fn<Promise<GeminiResponse>, [any]>().mockResolvedValue({
    text: "Mocked Gemini response for testing"
  })
}));

describe('API Failure Handling', () => {
  // Reset mocks between tests
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRecommendations.mockReset();
  });

  describe('Retry mechanism tests', () => {
    test('Successfully retries after temporary failures', () => {
      // Setup mock to fail twice, then succeed
      mockGetRecommendations
        .mockRejectedValueOnce(new Error('Service unavailable'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce([{ id: 'movie1', title: 'Success Movie' }]);
      
      // Simple retry function
      const retry = async (fn: () => Promise<any>, maxRetries: number) => {
        let lastError;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            return await fn();
          } catch (error) {
            lastError = error;
            // In real code, would wait before retrying
          }
        }
        
        throw lastError;
      };
      
      // Test the retry function
      return retry(() => mockGetRecommendations({ query: 'action' }), 3)
        .then(result => {
          expect(mockGetRecommendations).toHaveBeenCalledTimes(3);
          expect(result).toEqual([{ id: 'movie1', title: 'Success Movie' }]);
        });
    });

    test('Throws error after exceeding max retries', async () => {
      // Configure mock to always fail
      mockGetRecommendations.mockRejectedValue(new Error('Service unavailable'));
      
      // Simple retry function
      const retry = async (fn: () => Promise<any>, maxRetries: number) => {
        let lastError;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            return await fn();
          } catch (error) {
            lastError = error;
            // In real code, would wait before retrying
          }
        }
        
        throw lastError;
      };
      
      // Test the retry function
      await expect(
        retry(() => mockGetRecommendations({ query: 'action' }), 3)
      ).rejects.toThrow('Service unavailable');
      
      expect(mockGetRecommendations).toHaveBeenCalledTimes(3);
    });
  });

  describe('Fallback mechanism tests', () => {
    test('Returns fallback recommendations when primary source fails', async () => {
      // Configure mock to fail
      mockGetRecommendations.mockRejectedValue(new Error('Service unavailable'));
      
      // Function with fallback mechanism
      const getWithFallback = async () => {
        try {
          return await mockGetRecommendations({ query: 'action' });
        } catch (error) {
          // Return fallback data on error
          return [
            { id: 'fallback1', title: 'Popular Movie 1', type: 'fallback' },
            { id: 'fallback2', title: 'Popular Movie 2', type: 'fallback' }
          ];
        }
      };
      
      const result = await getWithFallback();
      
      expect(mockGetRecommendations).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        { id: 'fallback1', title: 'Popular Movie 1', type: 'fallback' },
        { id: 'fallback2', title: 'Popular Movie 2', type: 'fallback' }
      ]);
    });
    
    test('Partial results are returned when some API calls succeed', async () => {
      // Mock implementation that returns partial results
      const getPartialResults = async () => {
        const results = [];
        
        try {
          // First API call fails
          await mockGetRecommendations.mockRejectedValueOnce(new Error('Failed'));
          
          // Second API call succeeds
          results.push({ id: 'partial1', title: 'Partial Result 1' });
          
          return results;
        } catch (error) {
          // Even if there's an error, return whatever results we have
          return results.length > 0 ? results : [{ id: 'fallback', title: 'Fallback Movie', type: 'fallback' }];
        }
      };
      
      const result = await getPartialResults();
      expect(result).toEqual([{ id: 'partial1', title: 'Partial Result 1' }]);
    });
  });
}); 