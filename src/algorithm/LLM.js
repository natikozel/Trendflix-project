// Gemini API Integration
import { GoogleGenerativeAI } from '@google/generative-ai';

// This should be stored in an environment variable
const GEMINI_API_KEY = 'AIzaSyBNtyIbkURBokJNJL5He5vwY8-ix6P72Ws';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Cleans the response text by removing markdown code blocks and other formatting
 * @param {string} text - The raw response text
 * @returns {string} Cleaned text ready for JSON parsing
 */
function cleanResponseText(text) {
    // Remove markdown code blocks
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Remove any leading/trailing whitespace
    text = text.trim();
    
    // If the text starts with multiple newlines, remove them
    text = text.replace(/^\n+/, '');
    
    return text;
}

/**
 * Sends a prompt to Gemini API and returns the response as a parsed JSON object
 * @param {string} prompt - The user's input prompt
 * @returns {Promise<Object>} The model's response as a JavaScript object
 * @throws {Error} If the response is not valid JSON or if the API call fails
 */
export async function generateGeminiResponse(prompt) {
    try {
        // Get the Gemini Pro model
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Generate content
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
