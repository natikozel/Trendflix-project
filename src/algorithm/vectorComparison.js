export function compareGenreVectors(userVector, movieVector, matchThreshold = 0.1) {
  if (!userVector || !movieVector) {
    throw new Error('Both user vector and movie vector must be provided');
  }

  const allAttributes = new Set([
    ...Object.keys(userVector),
    ...Object.keys(movieVector)
  ]);

  let totalDistance = 0;
  let maxPossibleDistance = allAttributes.size;
  const matchingAttributes = [];

  for (const attr of allAttributes) {
    const userValue = userVector[attr] || 0;
    const movieValue = movieVector[attr] || 0;
    
    const distance = Math.abs(userValue - movieValue);
    
    totalDistance += distance;
    
    if (distance <= matchThreshold) {
      matchingAttributes.push(attr);
    }
  }

  const averageDistance = totalDistance / maxPossibleDistance;
  const similarityScore = Math.max(0, Math.min(1, 1 - averageDistance));

  return {
    similarityScore,
    matchingAttributes
  };
}

export function cosineSimilarityComparison(userVector, movieVector, matchThreshold = 0.2) {
  if (!userVector || !movieVector) {
    throw new Error('Both user vector and movie vector must be provided');
  }

  const allAttributes = new Set([
    ...Object.keys(userVector),
    ...Object.keys(movieVector)
  ]);

  let dotProduct = 0;
  let userMagnitude = 0;
  let movieMagnitude = 0;
  const matchingAttributes = [];

  for (const attr of allAttributes) {
    const userValue = userVector[attr] || 0;
    const movieValue = movieVector[attr] || 0;
    
    dotProduct += userValue * movieValue;
    
    userMagnitude += userValue * userValue;
    movieMagnitude += movieValue * movieValue;
    
    if (Math.abs(userValue - movieValue) <= matchThreshold) {
      matchingAttributes.push(attr);
    }
  }

  userMagnitude = Math.sqrt(userMagnitude);
  movieMagnitude = Math.sqrt(movieMagnitude);
  
  const similarityScore = (userMagnitude > 0 && movieMagnitude > 0) 
    ? dotProduct / (userMagnitude * movieMagnitude)
    : 0;
    
  const normalizedScore = Math.max(0, Math.min(1, (similarityScore + 1) / 2));

  return {
    similarityScore: normalizedScore,
    matchingAttributes
  };
}

export function weightedComparison(userVector, movieVector, matchThreshold = 0.2) {
  if (!userVector || !movieVector) {
    throw new Error('Both user vector and movie vector must be provided');
  }

  const allAttributes = new Set([
    ...Object.keys(userVector),
    ...Object.keys(movieVector)
  ]);

  let weightedSum = 0;
  let totalWeight = 0;
  const matchingAttributes = [];

  for (const attr of allAttributes) {
    const userValue = userVector[attr] || 0;
    const movieValue = movieVector[attr] || 0;
    
    const weight = userValue;
    
    const attributeSimilarity = 1 - Math.abs(userValue - movieValue);
    
    weightedSum += weight * attributeSimilarity;
    totalWeight += weight;
    
    if (Math.abs(userValue - movieValue) <= matchThreshold) {
      matchingAttributes.push(attr);
    }
  }

  const similarityScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  return {
    similarityScore,
    matchingAttributes
  };
}

export async function testDiverseVectorComparison() {
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

  const thresholds = [0.1];
  
  for (const threshold of thresholds) {
    console.log(`\n==== Testing with threshold: ${threshold} ====\n`);
    
    for (const movie of movies) {
      console.log(`\n--- Movie: ${movie.name} ---`);
      
      const simpleResult = compareGenreVectors(userVector, movie.vector, threshold);
      console.log(`Simple comparison: ${simpleResult.similarityScore.toFixed(4)}`);
      console.log(`Matching attributes (${simpleResult.matchingAttributes.length}): ${simpleResult.matchingAttributes.join(', ')}`);
      
      const cosineResult = cosineSimilarityComparison(userVector, movie.vector, threshold);
      console.log(`Cosine similarity: ${cosineResult.similarityScore.toFixed(4)}`);
      console.log(`Matching attributes (${cosineResult.matchingAttributes.length}): ${cosineResult.matchingAttributes.join(', ')}`);
      
      const weightedResult = weightedComparison(userVector, movie.vector, threshold);
      console.log(`Weighted comparison: ${weightedResult.similarityScore.toFixed(4)}`);
      console.log(`Matching attributes (${weightedResult.matchingAttributes.length}): ${weightedResult.matchingAttributes.join(', ')}`);
    }
  }
}

export default weightedComparison;