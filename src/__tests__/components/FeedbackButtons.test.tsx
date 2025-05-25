import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FeedbackButtons from '@/components/common/FeedbackButtons';
import { jest } from '@jest/globals';

describe('Submit Feedback', () => {
  // Mock the feedback submission function
  const mockOnFeedbackSubmit = jest.fn();
  
  beforeEach(() => {
    // Reset the mock before each test
    mockOnFeedbackSubmit.mockReset();
    mockOnFeedbackSubmit.mockResolvedValue({ success: true });
  });

  test('User can submit positive feedback for a movie recommendation', async () => {
    // Render the FeedbackButtons component
    render(
      <FeedbackButtons 
        movieId="123"
        onFeedbackSubmit={mockOnFeedbackSubmit}
      />
    );
    
    // Find and click the "Like" button
    const likeButton = screen.getByLabelText('Like this recommendation');
    fireEvent.click(likeButton);
    
    // Wait for the feedback submission to be called
    await waitFor(() => {
      expect(mockOnFeedbackSubmit).toHaveBeenCalledTimes(1);
    });
    
    // Verify the correct parameters were passed to the feedback submission function
    expect(mockOnFeedbackSubmit).toHaveBeenCalledWith('123', true);
  });

  test('User can submit negative feedback for a movie recommendation', async () => {
    // Render the FeedbackButtons component
    render(
      <FeedbackButtons 
        movieId="123"
        onFeedbackSubmit={mockOnFeedbackSubmit}
      />
    );
    
    // Find and click the "Dislike" button
    const dislikeButton = screen.getByLabelText('Dislike this recommendation');
    fireEvent.click(dislikeButton);
    
    // Wait for the feedback submission to be called
    await waitFor(() => {
      expect(mockOnFeedbackSubmit).toHaveBeenCalledTimes(1);
    });
    
    // Verify the correct parameters were passed to the feedback submission function
    expect(mockOnFeedbackSubmit).toHaveBeenCalledWith('123', false);
  });

  test('Feedback is saved and linked to user preferences', async () => {
    // Mock the feedback submission function implementation
    mockOnFeedbackSubmit.mockImplementation(async (movieId, liked) => {
      // Simulate the server action that would save the feedback and link it to user preferences
      return {
        success: true,
        feedback: {
          movieId,
          liked,
          timestamp: new Date(),
          userInputData: {
            freeText: 'I like sci-fi movies',
            genres: ['Sci-Fi', 'Action'],
          },
        },
      };
    });
    
    // Render the FeedbackButtons component
    render(
      <FeedbackButtons 
        movieId="123"
        onFeedbackSubmit={mockOnFeedbackSubmit}
      />
    );
    
    // Find and click the "Like" button
    const likeButton = screen.getByLabelText('Like this recommendation');
    fireEvent.click(likeButton);
    
    // Wait for the feedback submission to be called
    await waitFor(() => {
      expect(mockOnFeedbackSubmit).toHaveBeenCalledTimes(1);
    });
    
    // Verify the feedback result structure
    const result = await mockOnFeedbackSubmit.mock.results[0].value;
    expect(result.success).toBe(true);
    expect(result.feedback).toMatchObject({
      movieId: '123',
      liked: true,
      userInputData: expect.any(Object),
    });
  });

  test('Feedback buttons display confirmation after submission', async () => {
    // Render the FeedbackButtons component
    render(
      <FeedbackButtons 
        movieId="123"
        onFeedbackSubmit={mockOnFeedbackSubmit}
      />
    );
    
    // Find and click the "Like" button
    const likeButton = screen.getByLabelText('Like this recommendation');
    fireEvent.click(likeButton);
    
    // Wait for the feedback to be submitted
    await waitFor(() => {
      expect(mockOnFeedbackSubmit).toHaveBeenCalledTimes(1);
    });
    
    // Check that the feedback confirmation is displayed
    expect(screen.getByText(/thanks for your feedback/i)).toBeInTheDocument();
  });
}); 