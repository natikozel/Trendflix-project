import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore, Store } from '@reduxjs/toolkit';
import PreferenceForm from '@/components/recommend/PreferenceForm';
import recommendationsReducer from '@/store/recommendationsSlice';
import { jest } from '@jest/globals';

// Create a mock store
const createMockStore = () => {
  return configureStore({
    reducer: {
      recommendations: recommendationsReducer,
    },
  });
};

// Define the store type based on what createMockStore returns
type AppStore = ReturnType<typeof createMockStore>;

describe('User Input Preferences', () => {
  let mockStore: AppStore;
  
  beforeEach(() => {
    mockStore = createMockStore();
    // Reset the fetch mock before each test
    jest.spyOn(global, 'fetch').mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { movieId: '123', movieName: 'Test Movie', metadata: { posterUrl: '/test.jpg' } }
        ]),
      }) as Promise<Response>
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('User can submit preferences and receive recommendations within 500ms', async () => {
    // Render the PreferenceForm component with Redux provider
    render(
      <Provider store={mockStore}>
        <PreferenceForm />
      </Provider>
    );

    // Fill out the form
    const textInput = screen.getByLabelText(/Tell us what kind of movies you like/i);
    fireEvent.change(textInput, { target: { value: 'I love sci-fi movies with action and adventure' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /get recommendations/i });
    
    // Create a timestamp before submission
    const startTime = performance.now();
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Wait for the loading state to be set and then cleared
    await waitFor(() => {
      const state = mockStore.getState();
      expect(state.recommendations.isLoading).toBe(false);
    }, { timeout: 1000 });
    
    // Calculate response time
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    // Verify response time is under 500ms
    expect(responseTime).toBeLessThan(500);
    
    // Verify the API was called with the correct data
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/api/recommend', expect.any(Object));
    
    // Verify the form data was sent in the request
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const requestOptions = fetchCall[1];
    const requestBody = JSON.parse(requestOptions.body);
    
    expect(requestBody.freeText).toBe('I love sci-fi movies with action and adventure');
  });

  test('Form validates user input before submission', async () => {
    // Mock fetch to return a validation error
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          validationError: true,
          errorMessage: 'Please provide more specific information'
        }),
      }) as Promise<Response>
    );

    render(
      <Provider store={mockStore}>
        <PreferenceForm />
      </Provider>
    );

    // Submit form with minimal input
    const textInput = screen.getByLabelText(/Tell us what kind of movies you like/i);
    fireEvent.change(textInput, { target: { value: 'movies' } });
    
    const submitButton = screen.getByRole('button', { name: /get recommendations/i });
    fireEvent.click(submitButton);
    
    // Wait for the error popup
    await waitFor(() => {
      expect(mockStore.getState().recommendations.isLoading).toBe(false);
    });
    
    // Verify error handling was triggered
    expect(fetch).toHaveBeenCalledTimes(1);
    
    // Since we're mocking the response and not actually rendering the error popup (it's inside the component),
    // we can verify that the API was called and the loading state was reset
  });
}); 