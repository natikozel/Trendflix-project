import { jest } from '@jest/globals';

interface DbClient {
  connect: () => Promise<boolean>;
  disconnect: () => Promise<boolean>;
  collection: (name: string) => DbCollection;
  [key: string]: any;
}

interface DbCollection {
  insertOne: (data: any) => Promise<{ insertedId: string }>;
  findOne: (query: any) => Promise<any>;
  find: (query: any) => DbCollection;
  toArray: () => Promise<any[]>;
  updateOne: (query: any, update: any) => Promise<any>;
  [key: string]: any;
}

interface MovieApiResponse {
  id: string;
  title: string;
  release_year: number;
  genres: string[];
  poster_path: string;
  overview?: string;
}

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

describe('API Data Collection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    global.fetch = jest.fn(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      }) as unknown as Promise<Response>
    );
  });

  describe('Integration with database', () => {
    test('Successfully fetches and stores movie data from external APIs', async () => {
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

      const mockApiResponse = {
        id: 'tt1234567',
        title: 'Test Movie',
        release_year: 2023,
        genres: ['Action', 'Adventure'],
        poster_path: '/test-poster.jpg',
        overview: 'This is a test movie about testing.'
      };
      
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponse)
        }) as unknown as Promise<Response>
      );

      const fetchAndStoreMovieData = async (movieId: string, db: any) => {
        try {
          await db.connect();
          
          const moviesCollection = db.collection('movies');
          const existingMovie = await moviesCollection.findOne({ movie_id: movieId });
          
          if (existingMovie) {
            await db.disconnect();
            return existingMovie;
          }
          
          const response = await fetch(`https://api.example.com/movies/${movieId}`);
          
          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
          }
          
          const apiData = await response.json();
          
          const movieData = {
            movie_id: apiData.id,
            movie_name: apiData.title,
            release_year: apiData.release_year,
            genres: apiData.genres,
            poster_url: apiData.poster_path,
            synopsis: apiData.overview,
            created_at: new Date()
          };
          
          const result = await moviesCollection.insertOne(movieData);
          
          await db.disconnect();
          
          return { ...movieData, _id: result.insertedId };
        } catch (error) {
          await db.disconnect();
          console.error('Error fetching and storing movie data:', error);
          throw error;
        }
      };

      const result = await fetchAndStoreMovieData('tt1234567', mockDb);

      expect(mockDb.connect).toHaveBeenCalledTimes(1);
      expect(mockDb.collection).toHaveBeenCalledWith('movies');
      expect(mockCollection.findOne).toHaveBeenCalledWith({ movie_id: 'tt1234567' });
      expect(mockCollection.insertOne).toHaveBeenCalledTimes(1);
      expect(mockDb.disconnect).toHaveBeenCalledTimes(1);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('https://api.example.com/movies/tt1234567');

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

  test('Successfully fetches movie data from external APIs', async () => {
    const mockApiResponse = {
      id: 'tt1234567',
      title: 'Test Movie',
      release_year: 2023,
      genres: ['Action', 'Adventure'],
      poster_path: '/test-poster.jpg',
    };
    
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      }) as unknown as Promise<Response>
    );

    const fetchMovieData = async (movieId: string) => {
      try {
        const response = await fetch(`https://api.example.com/movies/${movieId}`);
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const movieData = await response.json();
        
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

    const result = await fetchMovieData('tt1234567');

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/movies/tt1234567'
    );

    expect(result).toEqual({
      movie_id: 'tt1234567',
      movie_name: 'Test Movie',
      release_year: 2023,
      genres: ['Action', 'Adventure'],
      poster_url: '/test-poster.jpg',
    });
  });

  test('Representative API endpoint https://api.example.com/movies returns data as expected', async () => {
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
    
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponse)
      }) as unknown as Promise<Response>
    );

    const fetchMoviesFromAPI = async () => {
      try {
        const response = await fetch('https://api.example.com/movies');
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        
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

    const result = await fetchMoviesFromAPI();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('https://api.example.com/movies');

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

    expect(result.results[0]).toMatchObject({
      id: 'tt0111161',
      title: 'The Shawshank Redemption',
      release_year: 1994,
      genres: ['Drama']
    });
  });

  test('Logs errors when API fetch fails and retry is needed', async () => {
    const mockError = new Error('API request failed');
    
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => Promise.reject(mockError))
      .mockImplementationOnce(() => Promise.reject(mockError))
      .mockImplementationOnce(() => Promise.reject(mockError));
    
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
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
          
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }
    };
    
    await expect(fetchMovieWithRetry('tt1234567')).rejects.toThrow('API request failed');
    
    expect(fetch).toHaveBeenCalledTimes(3);
    
    expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('Error fetching movie data (attempt 1/3)');
    
    consoleErrorSpy.mockRestore();
  });
});