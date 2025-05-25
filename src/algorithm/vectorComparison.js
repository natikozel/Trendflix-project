/**
 * Compares a user preference vector with a movie genre vector and returns
 * a similarity score and list of matching attributes
 * 
 * @param {Object} userVector - The user's preference vector
 * @param {Object} movieVector - The movie's genre vector
 * @param {number} matchThreshold - The maximum difference for attributes to be considered matching (default: 0.2)
 * @returns {Object} An object containing the similarity score and matching attributes
 */
export function compareGenreVectors(userVector, movieVector, matchThreshold = 0.1) {
  if (!userVector || !movieVector) {
    throw new Error('Both user vector and movie vector must be provided');
  }

  // Get all unique attributes from both vectors
  const allAttributes = new Set([
    ...Object.keys(userVector),
    ...Object.keys(movieVector)
  ]);

  let totalDistance = 0;
  let maxPossibleDistance = allAttributes.size; // Maximum possible distance (1.0 * number of attributes)
  const matchingAttributes = [];

  // Compare each attribute
  for (const attr of allAttributes) {
    const userValue = userVector[attr] || 0;
    const movieValue = movieVector[attr] || 0;
    
    // Calculate absolute distance between values
    const distance = Math.abs(userValue - movieValue);
    
    // Add to total distance
    totalDistance += distance;
    
    // Check if this attribute is a match
    if (distance <= matchThreshold) {
      matchingAttributes.push(attr);
    }
  }

  // Calculate similarity score (1.0 means identical, 0.0 means completely different)
  // We take 1 - (normalized distance) to get a similarity score
  const averageDistance = totalDistance / maxPossibleDistance;
  const similarityScore = Math.max(0, Math.min(1, 1 - averageDistance));

  return {
    similarityScore,
    matchingAttributes
  };
}

/**
 * Calculates similarity using cosine similarity, which measures the cosine of the
 * angle between two vectors, providing a similarity metric that is independent of magnitude
 * 
 * @param {Object} userVector - The user's preference vector
 * @param {Object} movieVector - The movie's genre vector
 * @param {number} matchThreshold - The maximum difference for attributes to be considered matching (default: 0.2)
 * @returns {Object} An object containing the similarity score and matching attributes
 */
export function cosineSimilarityComparison(userVector, movieVector, matchThreshold = 0.2) {
  if (!userVector || !movieVector) {
    throw new Error('Both user vector and movie vector must be provided');
  }

  // Get all unique attributes from both vectors
  const allAttributes = new Set([
    ...Object.keys(userVector),
    ...Object.keys(movieVector)
  ]);

  let dotProduct = 0;
  let userMagnitude = 0;
  let movieMagnitude = 0;
  const matchingAttributes = [];

  // Calculate dot product and magnitudes
  for (const attr of allAttributes) {
    const userValue = userVector[attr] || 0;
    const movieValue = movieVector[attr] || 0;
    
    // Calculate dot product
    dotProduct += userValue * movieValue;
    
    // Add to magnitudes
    userMagnitude += userValue * userValue;
    movieMagnitude += movieValue * movieValue;
    
    // Check if this attribute is a match
    if (Math.abs(userValue - movieValue) <= matchThreshold) {
      matchingAttributes.push(attr);
    }
  }

  // Calculate cosine similarity
  userMagnitude = Math.sqrt(userMagnitude);
  movieMagnitude = Math.sqrt(movieMagnitude);
  
  // Avoid division by zero
  const similarityScore = (userMagnitude > 0 && movieMagnitude > 0) 
    ? dotProduct / (userMagnitude * movieMagnitude)
    : 0;
    
  // Cosine similarity ranges from -1 to 1, normalize to 0 to 1
  const normalizedScore = Math.max(0, Math.min(1, (similarityScore + 1) / 2));

  return {
    similarityScore: normalizedScore,
    matchingAttributes
  };
}

/**
 * Weighted comparison that gives more importance to attributes that have higher values
 * in the user vector, prioritizing what the user cares about most
 * 
 * @param {Object} userVector - The user's preference vector
 * @param {Object} movieVector - The movie's genre vector
 * @param {number} matchThreshold - The maximum difference for attributes to be considered matching (default: 0.2)
 * @returns {Object} An object containing the similarity score and matching attributes
 */
export function weightedComparison(userVector, movieVector, matchThreshold = 0.2) {
  if (!userVector || !movieVector) {
    throw new Error('Both user vector and movie vector must be provided');
  }

  // Get all unique attributes from both vectors
  const allAttributes = new Set([
    ...Object.keys(userVector),
    ...Object.keys(movieVector)
  ]);

  let weightedSum = 0;
  let totalWeight = 0;
  const matchingAttributes = [];

  // Calculate weighted similarity
  for (const attr of allAttributes) {
    const userValue = userVector[attr] || 0;
    const movieValue = movieVector[attr] || 0;
    
    // The weight is the user value - what they care about most matters more
    const weight = userValue;
    
    // Calculate similarity for this attribute (1 - distance)
    const attributeSimilarity = 1 - Math.abs(userValue - movieValue);
    
    // Add to weighted sum
    weightedSum += weight * attributeSimilarity;
    totalWeight += weight;
    
    // Check if this attribute is a match
    if (Math.abs(userValue - movieValue) <= matchThreshold) {
      matchingAttributes.push(attr);
    }
  }

  // Calculate final weighted similarity score
  const similarityScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  return {
    similarityScore,
    matchingAttributes
  };
}

/**
 * Test function to demonstrate vector comparison with diverse mock data
 */
export async function testDiverseVectorComparison() {
  // A more diverse user preference vector
  const userVector = {
    "Action": 0.8,
    "Romance": 0.1,
    "SciFiFantasy": 0.8, 
    "Comedy": 0.2,
    "ThrillerSuspense": 0.7,
    "EmotionalDepth": 0.3,
    "Violence": 0.8,
    "FamilyFriendliness": 0.1,
    "Pace": 0.9,
    "VisualEffects": 0.8,
    "CinematicScore": 0.7,
    "DialogueComplexity": 0.4,
    "HumorType": 0.2,
    "StoryDarkness": 0.8,
    "Realism": 0.3,
    "DialogueVsAction": 0.2,
    "PoliticalSocial": 0.2,
    "TwistFactor": 0.7,
    "Horror": 0.6,
    "CognitiveLoad": 0.5,
    "MovieLength": 0.6
  };

  // Create several diverse movie vectors for comparison
  const movies = [
    {
      name: "Matching Action Movie",
      vector: {
        "Action": 0.9,
        "Romance": 0.2,
        "SciFiFantasy": 0.7, 
        "Comedy": 0.3,
        "ThrillerSuspense": 0.8,
        "EmotionalDepth": 0.4,
        "Violence": 0.7,
        "FamilyFriendliness": 0.2,
        "Pace": 0.8,
        "VisualEffects": 0.7,
        "CinematicScore": 0.6,
        "DialogueComplexity": 0.5,
        "HumorType": 0.3,
        "StoryDarkness": 0.7,
        "Realism": 0.4,
        "DialogueVsAction": 0.3,
        "PoliticalSocial": 0.3,
        "TwistFactor": 0.6,
        "Horror": 0.5,
        "CognitiveLoad": 0.6,
        "MovieLength": 0.7
      }
    }
  ];

  // Test with different threshold values
  const thresholds = [0.1];
  
  for (const threshold of thresholds) {
    console.log(`\n==== Testing with threshold: ${threshold} ====\n`);
    
    for (const movie of movies) {
      console.log(`\n--- Movie: ${movie.name} ---`);
      
      // Simple comparison
      const simpleResult = compareGenreVectors(userVector, movie.vector, threshold);
      console.log(`Simple comparison: ${simpleResult.similarityScore.toFixed(4)}`);
      console.log(`Matching attributes (${simpleResult.matchingAttributes.length}): ${simpleResult.matchingAttributes.join(', ')}`);
      
      // Cosine similarity
      const cosineResult = cosineSimilarityComparison(userVector, movie.vector, threshold);
      console.log(`Cosine similarity: ${cosineResult.similarityScore.toFixed(4)}`);
      console.log(`Matching attributes (${cosineResult.matchingAttributes.length}): ${cosineResult.matchingAttributes.join(', ')}`);
      
      // Weighted comparison
      const weightedResult = weightedComparison(userVector, movie.vector, threshold);
      console.log(`Weighted comparison: ${weightedResult.similarityScore.toFixed(4)}`);
      console.log(`Matching attributes (${weightedResult.matchingAttributes.length}): ${weightedResult.matchingAttributes.join(', ')}`);
    }
  }
}

// Export default function
export default weightedComparison;