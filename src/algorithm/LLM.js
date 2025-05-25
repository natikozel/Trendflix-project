import { GoogleGenerativeAI } from '@google/generative-ai';

let GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) 
    GEMINI_API_KEY = "AIzaSyB2NeGhgq6LpQRNcd9csyjvnWApyy1_wfw";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

function cleanResponseText(text) {
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    text = text.trim();
    text = text.replace(/^\n+/, '');
    
    return text;
}

export async function generateGeminiResponse(prompt) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-04-17' });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();

        try {
            const cleanedResponse = cleanResponseText(textResponse);
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

