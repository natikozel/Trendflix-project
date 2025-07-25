export const mockMovies = [
  {
    movieId: 'tt1234567',
    movieName: 'Test Action Movie',
    similarity: '0.85',
    finalScore: '0.72',
    metadata: {
      popularity: 8.5,
      releaseYear: 2023,
      duration: 126,
      genres: ['Action', 'Adventure', 'Sci-Fi'],
      posterUrl: '/test-action-movie.jpg'
    }
  },
  {
    movieId: 'tt2345678',
    movieName: 'Test Drama Movie',
    similarity: '0.65',
    finalScore: '0.59',
    metadata: {
      popularity: 7.8,
      releaseYear: 2022,
      duration: 118,
      genres: ['Drama', 'Romance'],
      posterUrl: '/test-drama-movie.jpg'
    }
  },
  {
    movieId: 'tt3456789',
    movieName: 'Test Comedy Movie',
    similarity: '0.58',
    finalScore: '0.51',
    metadata: {
      popularity: 6.9,
      releaseYear: 2023,
      duration: 95,
      genres: ['Comedy', 'Family'],
      posterUrl: '/test-comedy-movie.jpg'
    }
  }
];

export const mockMovieDetails = {
  movieId: 'tt1234567',
  movieName: 'Test Action Movie',
  posterUrl: '/test-action-movie.jpg',
  releaseYear: 2023,
  duration: 126,
  genres: ['Action', 'Adventure', 'Sci-Fi'],
  synopsis: 'This is a test action movie with exciting sequences and special effects.',
  reviews: [
    { author: 'Reviewer 1', text: 'Incredible action scenes and great visual effects!' },
    { author: 'Reviewer 2', text: 'Entertaining but somewhat predictable plot.' },
    { author: 'Reviewer 3', text: 'The lead actor gave an outstanding performance.' }
  ],
  popularity: 8.5,
  ageRating: 'PG-13',
};

export const mockUserInput = {
  freeText: 'I love action movies with sci-fi elements and lots of visual effects',
  age: 30,
  gender: 'any',
  preferredDuration: 120,
  preferredLanguage: 'English',
  preferNewReleases: true,
  yearRange: {
    minYear: 2000,
    maxYear: 2023
  },
  genres: ['Action', 'Sci-Fi', 'Adventure'],
  excludedGenres: ['Horror', 'Romance']
};

export const mockFeedback = {
  _id: 'feedback123',
  movieId: 'tt1234567',
  liked: true,
  timestamp: new Date('2023-05-15'),
  userInputData: mockUserInput,
  recommendationScore: 0.72,
  createdAt: new Date('2023-05-15'),
  updatedAt: new Date('2023-05-15')
}; 