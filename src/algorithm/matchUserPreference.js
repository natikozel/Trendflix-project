import { generateGeminiResponse } from './LLM.js';
import GenreVectorService from '../lib/db/services/genreVectorService.js';

/**
 * Prompt template for the LLM to analyze user preference match with movie genre vector
 */
const MATCH_ANALYSIS_PROMPT = `
Movie Preference Matching Analysis

You are an expert movie analyst. Your task is to determine how well a movie matches a user's preferences based on the movie's genre vector and the user's input.

INSTRUCTIONS:
1. Analyze the movie's genre vector which represents its characteristics (values between 0-1, sum = 1.0)
2. Consider the user's input text carefully
3. Determine how well the movie's characteristics align with what the user is looking for
4. Return a single float number between 0.00 and 1.00 representing the match percentage
   - 0.00 means no match at all
   - 1.00 means perfect match
   - Values should be precise to 2 decimal places

MOVIE GENRE VECTOR:
{MOVIE_VECTOR}

USER INPUT:
{USER_INPUT}

OUTPUT FORMAT:
Return ONLY a JSON object with a single "matchScore" field containing the float value.
Example: {"matchScore": 0.85}

IMPORTANT:
- Be precise and analytical in your assessment
- Consider both explicit and implicit preferences in the user's input
- Higher values should be given to movies that strongly match the user's stated preferences
- Lower values should be given when there are clear mismatches or missing elements the user wants
`;

/**
 * Analyzes how well a movie matches a user's preferences
 * @param {string} userInput - The user's preference text
 * @param {string} movieId - The ID of the movie to analyze
 * @returns {Promise<number>} A float between 0-1 representing the match score
 */
export async function analyzeUserPreferenceMatch(userInput, movieId) {
    try {
        // Get the movie's genre vector from the database using the service
        const vector = await GenreVectorService.getByMovieId(movieId);
        
        if (!vector) {
            throw new Error(`No genre vector found for movie ID: ${movieId}`);
        }

        const movieVector = vector.genreVector;

        // Create the prompt with the movie vector and user input
        const prompt = MATCH_ANALYSIS_PROMPT
            .replace('{MOVIE_VECTOR}', JSON.stringify(movieVector, null, 2))
            .replace('{USER_INPUT}', userInput);

        // Get the LLM response
        const response = await generateGeminiResponse(prompt);

        // Validate the response
        if (!response || typeof response.matchScore !== 'number') {
            throw new Error('Invalid response format from LLM');
        }

        // Ensure the score is between 0 and 1
        const matchScore = Math.max(0, Math.min(1, response.matchScore));
        
        return matchScore;
    } catch (error) {
        console.error('Error analyzing user preference match:', error);
        throw error;
    }
}

export default analyzeUserPreferenceMatch; 