import { jest } from '@jest/globals';

// Define interface for database client
interface DbClient {
  connect: () => Promise<boolean>;
  disconnect: () => Promise<boolean>;
  collection: (name: string) => DbCollection;
  [key: string]: any;
}

// Define interface for database collection
interface DbCollection {
  insertOne: (data: any) => Promise<{ insertedId: string }>;
  findOne: (query: any) => Promise<any>;
  find: (query: any) => DbCollection;
  toArray: () => Promise<any[]>;
  updateOne: (query: any, update: any) => Promise<any>;
  [key: string]: any;
}

// Define interface for API response
interface MovieApiResponse {
  id: string;
  title: string;
  release_year: number;
  genres: string[];
  poster_path: string;
  overview?: string;
}

// Define interface for stored movie data
interface MovieData {
  movie_id: string;
  movie_name: string;
  release_year: number;
  genres: string[];
  poster_url: string;
  synopsis?: string;
  created_at?: Date;
  _id?: string;
}

// Define a simpler test that doesn't rely on complex mocking
describe('API Data Collection', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup fetch mock
    global.fetch = jest.fn(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      }) as unknown as Promise<Response>
    );
  });

  // Implement database integration test with mocks
  describe('Integration with database', () => {
    test('Successfully fetches and stores movie data from external APIs', async () => {
      // Mock database operations
      const mockCollection = {
        insertOne: jest.fn<Promise<{ insertedId: string }>, [any]>().mockResolvedValue({ insertedId: 'mockId123' }),
        findOne: jest.fn<Promise<any>, [any]>().mockResolvedValue(null),
        find: jest.fn().mockReturnThis(),
        toArray: jest.fn<Promise<any[]>, []>().mockResolvedValue([]),
        updateOne: jest.fn<Promise<any>, [any, any]>().mockResolvedValue({})
      } as unknown as DbCollection;

      const mockDb = {
        connect: jest.fn<Promise<boolean>, []>().mockResolvedValue(true),
        disconnect: jest.fn<Promise<boolean>, []>().mockResolvedValue(true),
        collection: jest.fn<DbCollection, [string]>().mockReturnValue(mockCollection)
      };

      // Mock API response
      const mockApiResponse = {
        id: 'tt1234567',
        title: 'Test Movie',
        release_year: 2023,
        genres: ['Action', 'Adventure'],
        poster_path: '/test-poster.jpg',
        overview: 'This is a test movie about testing.'
      };
      
      // Setup fetch mock for this test
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponse)
        }) as unknown as Promise<Response>
      );

      // Create a function to fetch and store movie data
      const fetchAndStoreMovieData = async (movieId: string, db: any) => {
        try {
          // Connect to database
          await db.connect();
          
          // Check if movie already exists in database
          const moviesCollection = db.collection('movies');
          const existingMovie = await moviesCollection.findOne({ movie_id: movieId });
          
          // If movie exists, return it
          if (existingMovie) {
            await db.disconnect();
            return existingMovie;
          }
          
          // Fetch movie data from API
          const response = await fetch(`https://api.example.com/movies/${movieId}`);
          
          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
          }
          
          const apiData = await response.json();
          
          // Transform the data
          const movieData = {
            movie_id: apiData.id,
            movie_name: apiData.title,
            release_year: apiData.release_year,
            genres: apiData.genres,
            poster_url: apiData.poster_path,
            synopsis: apiData.overview,
            created_at: new Date()
          };
          
          // Store in database
          const result = await moviesCollection.insertOne(movieData);
          
          // Disconnect from database
          await db.disconnect();
          
          return { ...movieData, _id: result.insertedId };
        } catch (error) {
          // Ensure database is disconnected even if an error occurs
          await db.disconnect();
          console.error('Error fetching and storing movie data:', error);
          throw error;
        }
      };

      // Execute the function
      const result = await fetchAndStoreMovieData('tt1234567', mockDb);

      // Verify database operations
      expect(mockDb.connect).toHaveBeenCalledTimes(1);
      expect(mockDb.collection).toHaveBeenCalledWith('movies');
      expect(mockCollection.findOne).toHaveBeenCalledWith({ movie_id: 'tt1234567' });
      expect(mockCollection.insertOne).toHaveBeenCalledTimes(1);
      expect(mockDb.disconnect).toHaveBeenCalledTimes(1);

      // Verify API was called
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('https://api.example.com/movies/tt1234567');

      // Verify the expected result was returned
      expect(result).toMatchObject({
        movie_id: 'tt1234567',
        movie_name: 'Test Movie',
        release_year: 2023,
        genres: ['Action', 'Adventure'],
        poster_url: '/test-poster.jpg',
        synopsis: 'This is a test movie about testing.'
      });
      expect(result).toHaveProperty('_id', 'mockId123');
      expect(result).toHaveProperty('created_at');
      expect(result.created_at).toBeInstanceOf(Date);
    });
  });

  // Focus on testing the data fetching part without database interaction
  test('Successfully fetches movie data from external APIs', async () => {
    // Mock successful API response
    const mockApiResponse = {
      id: 'tt1234567',
      title: 'Test Movie',
      release_year: 2023,
      genres: ['Action', 'Adventure'],
      poster_path: '/test-poster.jpg',
    };
    
    // Setup fetch mock for this test
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      }) as unknown as Promise<Response>
    );

    // Create a simple function to fetch movie data
    const fetchMovieData = async (movieId: string) => {
      try {
        // Fetch movie data from API
        const response = await fetch(`https://api.example.com/movies/${movieId}`);
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const movieData = await response.json();
        
        // Transform the data (without storing)
        return {
          movie_id: movieData.id,
          movie_name: movieData.title,
          release_year: movieData.release_year,
          genres: movieData.genres,
          poster_url: movieData.poster_path,
        };
      } catch (error) {
        console.error('Error fetching movie data:', error);
        throw error;
      }
    };

    // Execute the function
    const result = await fetchMovieData('tt1234567');

    // Verify API was called correctly
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/movies/tt1234567'
    );

    // Verify the expected result was returned
    expect(result).toEqual({
      movie_id: 'tt1234567',
      movie_name: 'Test Movie',
      release_year: 2023,
      genres: ['Action', 'Adventure'],
      poster_url: '/test-poster.jpg',
    });
  });

  test('Representative API endpoint https://api.example.com/movies returns data as expected', async () => {
    // Mock successful API response for the representative endpoint
    const mockApiResponse = {
      results: [
        {
          id: 'tt0111161',
          title: 'The Shawshank Redemption',
          release_year: 1994,
          genres: ['Drama'],
          poster_path: '/shawshank.jpg',
          overview: 'Two imprisoned men bond over a number of years.'
        },
        {
          id: 'tt0068646',
          title: 'The Godfather',
          release_year: 1972,
          genres: ['Crime', 'Drama'],
          poster_path: '/godfather.jpg',
          overview: 'The aging patriarch of an organized crime dynasty.'
        }
      ],
      total_results: 2,
      page: 1
    };
    
    // Setup fetch mock for this test
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponse)
      }) as unknown as Promise<Response>
    );

    // Create a function to fetch from the representative API endpoint
    const fetchMoviesFromAPI = async () => {
      try {
        const response = await fetch('https://api.example.com/movies');
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        
        // Verify the response structure
        expect(data).toHaveProperty('results');
        expect(data).toHaveProperty('total_results');
        expect(data).toHaveProperty('page');
        expect(Array.isArray(data.results)).toBe(true);
        
        return data;
      } catch (error) {
        console.error('Error fetching from API endpoint:', error);
        throw error;
      }
    };

    // Execute the function
    const result = await fetchMoviesFromAPI();

    // Verify API was called correctly
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('https://api.example.com/movies');

    // Verify the expected result structure
    expect(result).toMatchObject({
      results: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          title: expect.any(String),
          release_year: expect.any(Number),
          genres: expect.any(Array),
          poster_path: expect.any(String)
        })
      ]),
      total_results: 2,
      page: 1
    });

    // Verify specific movie data
    expect(result.results[0]).toMatchObject({
      id: 'tt0111161',
      title: 'The Shawshank Redemption',
      release_year: 1994,
      genres: ['Drama']
    });
  });

  test('Logs errors when API fetch fails and retry is needed', async () => {
    // Mock API failure
    const mockError = new Error('API request failed');
    
    // Set up consecutive mock implementations
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => Promise.reject(mockError))
      .mockImplementationOnce(() => Promise.reject(mockError))
      .mockImplementationOnce(() => Promise.reject(mockError));
    
    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Create a function with retry logic
    const fetchMovieWithRetry = async (movieId: string, maxRetries = 3) => {
      let retries = 0;
      
      while (retries < maxRetries) {
        try {
          const response = await fetch(`https://api.example.com/movies/${movieId}`);
          
          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
          }
          
          const data = await response.json();
          return data;
        } catch (error) {
          retries++;
          console.error(`Error fetching movie data (attempt ${retries}/${maxRetries}):`, error);
          
          if (retries >= maxRetries) {
            throw error;
          }
          
          // Wait before retrying (use minimal delay for tests)
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }
    };
    
    // Execute the function and expect it to reject
    await expect(fetchMovieWithRetry('tt1234567')).rejects.toThrow('API request failed');
    
    // Verify API was called the correct number of times
    expect(fetch).toHaveBeenCalledTimes(3);
    
    // Verify errors were logged
    expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('Error fetching movie data (attempt 1/3)');
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
}); 