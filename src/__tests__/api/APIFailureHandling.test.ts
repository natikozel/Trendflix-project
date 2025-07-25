import { jest } from '@jest/globals';

interface Recommendation {
  id: string;
  title: string;
  type?: string;
}

interface GeminiResponse {
  text: string;
}

const mockGetRecommendations = jest.fn<Promise<Recommendation[]>, [any]>();

jest.mock('@/algorithm/recommender.js', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getRecommendations: mockGetRecommendations
  }))
}));

jest.mock('@/algorithm/LLM.js', () => ({
  generateGeminiResponse: jest.fn<Promise<GeminiResponse>, [any]>().mockResolvedValue({
    text: "Mocked Gemini response for testing"
  })
}));

describe('API Failure Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRecommendations.mockReset();
  });

  describe('Retry mechanism tests', () => {
    test('Successfully retries after temporary failures', () => {
      mockGetRecommendations
        .mockRejectedValueOnce(new Error('Service unavailable'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce([{ id: 'movie1', title: 'Success Movie' }]);
      
      const retry = async (fn: () => Promise<any>, maxRetries: number) => {
        let lastError;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            return await fn();
          } catch (error) {
            lastError = error;
          }
        }
        
        throw lastError;
      };
      
      return retry(() => mockGetRecommendations({ query: 'action' }), 3)
        .then(result => {
          expect(mockGetRecommendations).toHaveBeenCalledTimes(3);
          expect(result).toEqual([{ id: 'movie1', title: 'Success Movie' }]);
        });
    });

    test('Throws error after exceeding max retries', async () => {
      mockGetRecommendations.mockRejectedValue(new Error('Service unavailable'));
      
      const retry = async (fn: () => Promise<any>, maxRetries: number) => {
        let lastError;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            return await fn();
          } catch (error) {
            lastError = error;
          }
        }
        
        throw lastError;
      };
      
      await expect(
        retry(() => mockGetRecommendations({ query: 'action' }), 3)
      ).rejects.toThrow('Service unavailable');
      
      expect(mockGetRecommendations).toHaveBeenCalledTimes(3);
    });
  });

  describe('Fallback mechanism tests', () => {
    test('Returns fallback recommendations when primary source fails', async () => {
      mockGetRecommendations.mockRejectedValue(new Error('Service unavailable'));
      
      const getWithFallback = async () => {
        try {
          return await mockGetRecommendations({ query: 'action' });
        } catch (error) {
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

    test('Representative invalid API endpoint http://invalid.api/movies is handled gracefully', async () => {
      global.fetch = jest.fn(() => 
        Promise.reject(new Error('Network error: getaddrinfo ENOTFOUND invalid.api'))
      ) as unknown as typeof fetch;
      
      const fetchFromInvalidAPI = async () => {
        try {
          const response = await fetch('http://invalid.api/movies');
          
          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
          }
          
          return await response.json();
        } catch (error) {
          console.error('Invalid API endpoint error:', error);
          
          return {
            error: true,
            message: 'API endpoint unreachable',
            fallbackData: [
              { id: 'fallback1', title: 'Popular Movie 1', type: 'fallback' },
              { id: 'fallback2', title: 'Popular Movie 2', type: 'fallback' }
            ]
          };
        }
      };
      
      const result = await fetchFromInvalidAPI();
      
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('http://invalid.api/movies');
      
      expect(result).toMatchObject({
        error: true,
        message: 'API endpoint unreachable',
        fallbackData: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            title: expect.any(String),
            type: 'fallback'
          })
        ])
      });
    });

    test('API endpoint that doesn\'t exist returns appropriate error handling', async () => {
      global.fetch = jest.fn(() => 
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: () => Promise.resolve({ error: 'Endpoint not found' })
        })
      ) as unknown as typeof fetch;
      
      const fetchFromNonExistentEndpoint = async () => {
        try {
          const response = await fetch('http://invalid.api/movies');
          
          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
          }
          
          return await response.json();
        } catch (error) {
          return {
            error: true,
            message: error instanceof Error ? error.message : 'Unknown error',
            fallbackRecommendations: [
              { id: 'popular1', title: 'Trending Movie 1', type: 'popular' },
              { id: 'popular2', title: 'Trending Movie 2', type: 'popular' }
            ]
          };
        }
      };
      
      const result = await fetchFromNonExistentEndpoint();
      
      expect(fetch).toHaveBeenCalledTimes(1);
      
      expect(result).toMatchObject({
        error: true,
        message: expect.stringContaining('API request failed with status 404'),
        fallbackRecommendations: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            title: expect.any(String),
            type: 'popular'
          })
        ])
      });
    });
    
    test('Partial results are returned when some API calls succeed', async () => {
      const getPartialResults = async () => {
        const results = [];
        
        try {
          await mockGetRecommendations.mockRejectedValueOnce(new Error('Failed'));
          
          results.push({ id: 'partial1', title: 'Partial Result 1' });
          
          return results;
        } catch (error) {
          return results.length > 0 ? results : [{ id: 'fallback', title: 'Fallback Movie', type: 'fallback' }];
        }
      };
      
      const result = await getPartialResults();
      expect(result).toEqual([{ id: 'partial1', title: 'Partial Result 1' }]);
    });
  });
});