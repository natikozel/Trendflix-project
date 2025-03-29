import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Movie {
  movieId: string;
  movieName: string;
  similarity: string;
  finalScore: string;
  metadata: {
    imdbRating?: number;
    releaseYear?: number;
    duration?: number;
    popularityScore?: number;
  };
}

interface RecommendationsState {
  items: Movie[];
  isLoading: boolean;
  error: string | null;
}

const initialState: RecommendationsState = {
  items: [],
  isLoading: false,
  error: null
};

const recommendationsSlice = createSlice({
  name: 'recommendations',
  initialState,
  reducers: {
    setRecommendations: (state, action: PayloadAction<Movie[]>) => {
      state.items = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearRecommendations: (state) => {
      state.items = [];
      state.error = null;
    }
  }
});

export const {
  setRecommendations,
  setLoading,
  setError,
  clearRecommendations
} = recommendationsSlice.actions;

export default recommendationsSlice.reducer; 