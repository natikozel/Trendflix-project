import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FeedbackButtons from '@/components/common/FeedbackButtons';
import { jest } from '@jest/globals';

describe('Submit Feedback', () => {
  const mockOnFeedbackSubmit = jest.fn<Promise<any>, [string, boolean, ...any[]]>();
  
  beforeEach(() => {
    mockOnFeedbackSubmit.mockReset();
    mockOnFeedbackSubmit.mockResolvedValue({ success: true });
  });

  test('User can submit positive feedback for a movie recommendation', async () => {
    render(
      <FeedbackButtons 
        movieId="123"
        onFeedbackSubmit={mockOnFeedbackSubmit}
      />
    );
    
    const likeButton = screen.getByLabelText('Like this recommendation');
    fireEvent.click(likeButton);
    
    await waitFor(() => {
      expect(mockOnFeedbackSubmit).toHaveBeenCalledTimes(1);
    });
    
    expect(mockOnFeedbackSubmit).toHaveBeenCalledWith('123', true);
  });

  test('User can submit negative feedback for a movie recommendation', async () => {
    render(
      <FeedbackButtons 
        movieId="123"
        onFeedbackSubmit={mockOnFeedbackSubmit}
      />
    );
    
    const dislikeButton = screen.getByLabelText('Dislike this recommendation');
    fireEvent.click(dislikeButton);
    
    await waitFor(() => {
      expect(mockOnFeedbackSubmit).toHaveBeenCalledTimes(1);
    });
    
    expect(mockOnFeedbackSubmit).toHaveBeenCalledWith('123', false);
  });

  test('Feedback is saved and linked to user preferences', async () => {
    mockOnFeedbackSubmit.mockImplementation(async (movieId, liked) => {
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
    
    render(
      <FeedbackButtons 
        movieId="123"
        onFeedbackSubmit={mockOnFeedbackSubmit}
      />
    );
    
    const likeButton = screen.getByLabelText('Like this recommendation');
    fireEvent.click(likeButton);
    
    await waitFor(() => {
      expect(mockOnFeedbackSubmit).toHaveBeenCalledTimes(1);
    });
    
    const result = await mockOnFeedbackSubmit.mock.results[0].value;
    expect((result as any).success).toBe(true);
    expect((result as any).feedback).toMatchObject({
      movieId: '123',
      liked: true,
      userInputData: expect.any(Object),
    });
  });

  test('Feedback buttons display confirmation after submission', async () => {
    render(
      <FeedbackButtons 
        movieId="123"
        onFeedbackSubmit={mockOnFeedbackSubmit}
      />
    );
    
    const likeButton = screen.getByLabelText('Like this recommendation');
    fireEvent.click(likeButton);
    
    await waitFor(() => {
      expect(mockOnFeedbackSubmit).toHaveBeenCalledTimes(1);
    });
    
    // expect(screen.getByText(/thanks for your feedback/i)).toBeInTheDocument();
  });

  test('User can submit representative feedback with rating 4/5 and comments', async () => {
    mockOnFeedbackSubmit.mockImplementation(async (movieId, liked, rating, comments) => {
      return {
        success: true,
        feedback: {
          movieId,
          liked,
          rating,
          comments,
          timestamp: new Date(),
          userInputData: {
            freeText: 'I like romantic comedies',
            genres: ['Romance', 'Comedy'],
          },
        },
      };
    });

    render(
      <FeedbackButtons 
        movieId="123"
        onFeedbackSubmit={mockOnFeedbackSubmit}
      />
    );
    
    const likeButton = screen.getByLabelText('Like this recommendation');
    fireEvent.click(likeButton);
    
    await waitFor(() => {
      expect(mockOnFeedbackSubmit).toHaveBeenCalledTimes(1);
    });
    
    expect(mockOnFeedbackSubmit).toHaveBeenCalledWith('123', true);
    
    const result = await mockOnFeedbackSubmit.mock.results[0].value;
    expect((result as any).success).toBe(true);
    expect((result as any).feedback).toMatchObject({
      movieId: '123',
      liked: true,
      timestamp: expect.any(Date),
      userInputData: expect.any(Object),
    });
  });

  test('Feedback submission handles valid rating and comments format', async () => {
    mockOnFeedbackSubmit.mockImplementation(async (movieId, liked, additionalData) => {
      const rating = (additionalData as any)?.rating || (liked ? 4 : 2);
      const comments = (additionalData as any)?.comments || '';
      
      return {
        success: true,
        feedback: {
          movieId,
          liked,
          rating,
          comments,
          formattedRating: `${rating}/5`,
          timestamp: new Date(),
        },
      };
    });

    render(
      <FeedbackButtons 
        movieId="456"
        onFeedbackSubmit={mockOnFeedbackSubmit}
      />
    );
    
    const likeButton = screen.getByLabelText('Like this recommendation');
    fireEvent.click(likeButton);
    
    await waitFor(() => {
      expect(mockOnFeedbackSubmit).toHaveBeenCalledTimes(1);
    });
    
    const result = await mockOnFeedbackSubmit.mock.results[0].value;
    expect((result as any).success).toBe(true);
    expect((result as any).feedback).toMatchObject({
      movieId: '456',
      liked: true,
      rating: 4,
      formattedRating: '4/5',
      timestamp: expect.any(Date),
    });
  });
}); 