import React from 'react';
import { render, screen } from '@testing-library/react';
import MovieDetails, { movieProps } from '@/components/movie/MovieDetails';
import { jest } from '@jest/globals';

// Suppress console errors during tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Mock the Next.js app router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock framer-motion to avoid animation issues
jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  }
}));

// Mock all child components to simplify testing
jest.mock('@/components/movie/MovieHero', () => {
  return function MockMovieHero({ movie }: any) {
    return <div>{movie.movieName}</div>;
  };
});

jest.mock('@/components/movie/MovieDetailsTab', () => {
  return function MockDetailsTab({ movie }: any) {
    return <div>{movie.movieName} details</div>;
  };
});

jest.mock('@/components/movie/MovieReviewsTab', () => {
  return function MockReviewsTab({ reviews }: any) {
    return <div>{reviews ? reviews.length : 0} reviews</div>;
  };
});

jest.mock('@/components/movie/SimilarMoviesTab', () => {
  return function MockSimilarMoviesTab({ similarMovies }: any) {
    return <div>{similarMovies?.length || 0} similar movies</div>;
  };
});

// Mock skeleton components
jest.mock('@/components/movie-hero-skeleton', () => () => <div data-testid="hero-skeleton">Loading hero...</div>);
jest.mock('@/components/movie-details-tab-skeleton', () => () => <div data-testid="details-skeleton">Loading details...</div>);
jest.mock('@/components/movie-reviews-tab-skeleton', () => () => <div data-testid="reviews-skeleton">Loading reviews...</div>);
jest.mock('@/components/similar-movies-tab-skeleton', () => () => <div data-testid="similar-skeleton">Loading similar...</div>);

// Mock tabs components
jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, ...props }: any) => <div data-testid="tabs" {...props}>{children}</div>,
  TabsContent: ({ children, value, ...props }: any) => <div data-testid={`tab-content-${value}`} {...props}>{children}</div>,
  TabsList: ({ children, ...props }: any) => <div data-testid="tabs-list" {...props}>{children}</div>,
  TabsTrigger: ({ children, value, ...props }: any) => <button data-testid={`tab-trigger-${value}`} {...props}>{children}</button>,
}));

// Mock Button component
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => <button data-testid="back-button" onClick={onClick} {...props}>{children}</button>,
}));

// Mock localStorage
const mockLocalStorage = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: function(key: string) {
      return store[key] || null;
    },
    setItem: function(key: string, value: string) {
      store[key] = value;
    },
    clear: function() {
      store = {};
    }
  };
})();
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('View Detailed Movie Information', () => {
  // Sample movie data for testing
  const movieData: movieProps = {
    movieId: 'test123',
    movieName: 'Test Movie',
    posterUrl: '/test-poster.jpg',
    releaseYear: 2023,
    duration: 120,
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    synopsis: 'This is a test movie synopsis.',
    reviews: ['Great movie!', 'Amazing effects and storyline.'],
    popularity: 8.5,
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup localStorage with mock data
    localStorage.setItem('movieRecommendations', JSON.stringify([
      {
        movieId: 'test123',
        movieName: 'Test Movie',
        posterUrl: '/test-poster.jpg',
        similarity: '0.8',
        finalScore: '8.5',
        popularity: 8.5,
        metadata: {
          releaseYear: 2023,
          duration: 120,
          genres: ['Action', 'Adventure', 'Sci-Fi'],
          posterUrl: '/test-poster.jpg',
          synopsis: 'This is a test movie synopsis.'
        }
      }
    ]));
  });

  // Using simple tests that verify the component renders without crashing
  test('Renders the movie title', async () => {
    const { container } = render(<MovieDetails movieData={movieData} />);
    
    // Allow for initial state update
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check if the movie title is rendered (h1 containing movie name)
    const titleElement = container.querySelector('h1');
    expect(titleElement).not.toBeNull();
    expect(titleElement?.textContent).toBe('Test Movie');
  });

  test('Renders movie genres as badges', async () => {
    const { container } = render(<MovieDetails movieData={movieData} />);
    
    // Allow for initial state update
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Look for badges containing genre names
    const badges = container.querySelectorAll('[data-slot="badge"]');
    expect(badges.length).toBeGreaterThanOrEqual(3);
    
    // Verify genres appear in badges
    const badgeTexts = Array.from(badges).map(badge => badge.textContent);
    expect(badgeTexts).toEqual(expect.arrayContaining(['Action', 'Adventure', 'Sci-Fi']));
  });

  test('Renders a back button', async () => {
    const { container } = render(<MovieDetails movieData={movieData} />);
    
    // Allow for initial state update
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Look for a button with the back arrow icon
    const backButton = container.querySelector('button');
    expect(backButton).not.toBeNull();
    
    // Check that it has an SVG icon inside
    const svg = backButton?.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  test('Renders with incomplete movie data without crashing', async () => {
    // Create movie data with minimal information
    const incompleteMovieData: movieProps = {
      movieId: 'incomplete456',
      movieName: 'Incomplete Movie',
      posterUrl: '',
      releaseYear: null,
      duration: 0,
      genres: [],
      synopsis: '',
      reviews: [],
      popularity: 0,
    };
    
    const { container } = render(<MovieDetails movieData={incompleteMovieData} />);
    
    // Allow for initial state update
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check if it renders without crashing
    const titleElement = container.querySelector('h1');
    expect(titleElement).not.toBeNull();
    expect(titleElement?.textContent).toBe('Incomplete Movie');
  });

  test('Displays movie metadata', async () => {
    const { container } = render(<MovieDetails movieData={movieData} />);
    
    // Allow for initial state update
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check for elements that would contain metadata
    const metadataSection = container.querySelector('.flex-wrap.items-center.gap-4.text-gray-300');
    expect(metadataSection).not.toBeNull();
  });
}); 