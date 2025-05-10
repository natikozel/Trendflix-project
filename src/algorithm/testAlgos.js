import { analyzeUserPreferenceMatch } from "./matchUserPreference.js";
async function testAlgo() {
    const matchScore = await analyzeUserPreferenceMatch(
        "Funny movie like jump_street 21",
        "21_jump_street_2011"
    );
    console.log(`Match score: ${matchScore}`); // Will output something like: Match score: 0.85
}
testAlgo();
