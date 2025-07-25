/**
 * Language Model Integration Module
 * 
 * This module provides integration with Google's Gemini language model for
 * advanced natural language understanding and preference extraction. It enables
 * the recommendation system to understand user input in natural language and
 * extract structured preferences from unstructured text.
 * 
 * The LLM integration is used for:
 * - Extracting movie preferences from natural language descriptions
 * - Identifying specific movie titles mentioned by users
 * - Classifying genres and themes from user input
 * - Analyzing sentiment and mood preferences
 * - Validating and structuring user input
 * 
 * Key Features:
 * - Structured JSON response parsing
 * - Error handling and fallbacks
 * - Response text cleaning and normalization
 * - Integration with Google Gemini API
 * 
 * @author Trendflix Team
 * @version 1.0.0
 */

// Gemini API Integration
import { GoogleGenerativeAI } from '@google/generative-ai';

// Use environment variable for API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Cleans the response text by removing markdown code blocks and other formatting
 * 
 * This function ensures that the LLM response is properly formatted for JSON parsing
 * by removing any markdown formatting that might interfere with parsing.
 * 
 * @param {string} text - The raw response text from the LLM
 * @returns {string} Cleaned text ready for JSON parsing
 */
function cleanResponseText(text) {
    // Remove markdown code blocks (```json and ```)
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Remove any leading/trailing whitespace
    text = text.trim();
    
    // If the text starts with multiple newlines, remove them
    text = text.replace(/^\n+/, '');
    
    return text;
}

/**
 * Sends a prompt to Gemini API and returns the response as a parsed JSON object
 * 
 * This function is the main interface for communicating with the Gemini language model.
 * It handles the API call, response processing, and JSON parsing to provide structured
 * data that can be used by the recommendation system.
 * 
 * The function is designed to work with structured prompts that request JSON responses,
 * making it easy to extract specific information like genres, keywords, and preferences
 * from natural language user input.
 * 
 * @param {string} prompt - The user's input prompt or structured query
 * @returns {Promise<Object>} The model's response as a JavaScript object
 * @throws {Error} If the response is not valid JSON or if the API call fails
 */
export async function generateGeminiResponse(prompt) {
    try {
        // Get the Gemini Pro model (using the latest available version)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // Generate content using the provided prompt
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();

        try {
            // Clean the response text before parsing
            const cleanedResponse = cleanResponseText(textResponse);
            
            // Attempt to parse the response as JSON
            const jsonResponse = JSON.parse(cleanedResponse);
            return jsonResponse;
        } catch (parseError) {
            console.error('Error parsing JSON response:', parseError);
            console.error('Raw response:', textResponse);
            throw new Error('Response was not valid JSON format');
        }
    } catch (error) {
        console.error('Error generating response:', error);
        throw new Error('Failed to generate response from Gemini');
    }
}

