import { generateGeminiResponse } from './LLM.js';
import { fileURLToPath } from 'url';

const USER_PREFERENCE_PROMPT = `
User Preference Analysis Task

I will analyze your text description of movie preferences to create a personalized genre profile. Based on what you share, I'll generate a numerical representation of your movie taste preferences.

After analyzing your input, I'll create a vector of 21 attributes that characterizes your movie preferences, with values between 0 and 1 representing how strongly each attribute aligns with your tastes.

The attributes include:
- Action: From no action (0) to high-intensity action (1)
- Romance: From no romance (0) to heavily romantic (1)
- SciFiFantasy: From realistic (0) to heavily sci-fi/fantasy (1)
- Comedy: From not funny (0) to very humorous (1)
- ThrillerSuspense: From no suspense (0) to extremely suspenseful (1)
- EmotionalDepth: From lighthearted (0) to emotionally profound (1)
- Violence: From non-violent (0) to extremely violent (1)
- FamilyFriendliness: From adult-oriented (0) to suitable for all ages (1)
- Pace: From very slow (0) to fast-paced (1)
- VisualEffects: From minimal effects (0) to CGI-heavy (1)
- CinematicScore: From forgettable soundtrack (0) to music-driven (1)
- DialogueComplexity: From simple conversations (0) to deep, complex dialogue (1)
- HumorType: From dry, subtle humor (0) to obvious slapstick comedy (1)
- StoryDarkness: From uplifting (0) to dark and tragic (1)
- Realism: From completely fictional (0) to based on true events (1)
- DialogueVsAction: From dialogue-heavy (0) to action-driven (1)
- PoliticalSocial: From no message (0) to strong political themes (1)
- TwistFactor: From completely predictable (0) to shocking plot twists (1)
- Horror: From not scary at all (0) to extremely frightening (1)
- CognitiveLoad: From easy-to-watch (0) to requires full concentration (1)
- MovieLength: From short film (0) to lengthy epic (1)

IMPORTANT: Provide your analysis as a JSON object where keys are the attribute names as listed above and values are decimal numbers between 0 and 1. Each value must be different to show which attributes are more prominent in the user's preferences.

Based on the following user input, generate the genre preference vector:
{USER_INPUT}

OUTPUT FORMAT:
Return only a valid JSON object with the attributes and their values. Do not include any explanation or text before or after the JSON.
`;

export async function generateUserPreferenceVector(userInput) {
    try {
        if (!userInput || userInput.trim() === '') {
            throw new Error('User input cannot be empty');
        }

        const prompt = USER_PREFERENCE_PROMPT.replace('{USER_INPUT}', userInput);
        const response = await generateGeminiResponse(prompt);

        const requiredAttributes = [
            'Action', 'Romance', 'SciFiFantasy', 'Comedy', 'ThrillerSuspense', 
            'EmotionalDepth', 'Violence', 'FamilyFriendliness', 'Pace', 'VisualEffects',
            'CinematicScore', 'DialogueComplexity', 'HumorType', 'StoryDarkness', 'Realism',
            'DialogueVsAction', 'PoliticalSocial', 'TwistFactor', 'Horror', 'CognitiveLoad',
            'MovieLength'
        ];

        const missingAttributes = requiredAttributes.filter(attr => !(attr in response));
        if (missingAttributes.length > 0) {
            throw new Error(`Missing attributes in response: ${missingAttributes.join(', ')}`);
        }

        for (const [key, value] of Object.entries(response)) {
            if (typeof value !== 'number' || value < 0 || value > 1) {
                throw new Error(`Invalid value for attribute ${key}: ${value}. Values must be numbers between 0 and 1.`);
            }
        }

        return response;
    } catch (error) {
        console.error('Error generating user preference vector:', error);
        throw error;
    }
}

export async function testUserPreferenceAnalysis() {
    const mockUserInput = `
    I love sci-fi movies with lots of visual effects and action sequences. 
    My favorite films usually have complex plots that make me think and interesting 
    plot twists. I'm not a big fan of slow-paced dramas or overly romantic movies. 
    I enjoy dark themes and don't mind violence if it serves the story. 
    I prefer movies with adult themes rather than family-friendly content. 
    I also enjoy good soundtrack and sound design in films.
    `;

    try {
        console.log('Analyzing mock user preferences...');
        const preferenceVector = await generateUserPreferenceVector(mockUserInput);
        console.log('User Preference Vector:');
        console.log(JSON.stringify(preferenceVector, null, 2));
        return preferenceVector;
    } catch (error) {
        console.error('Test failed:', error);
        throw error;
    }
}

export default generateUserPreferenceVector;