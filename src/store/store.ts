import { configureStore } from '@reduxjs/toolkit';
import recommendationsReducer from './recommendationsSlice';

export const store = configureStore({
  reducer: {
    recommendations: recommendationsReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 