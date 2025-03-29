import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Recommender from './recommender.js';
import UserInputProcessor from './userInputToVector.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadMovieData() {
  try {
    console.log("Loading movie data...");
    const dataDir = join(__dirname, '../data');
    
    try {
      await fs.promises.access(dataDir);
      console.log(`Data directory exists: ${dataDir}`);
    } catch (error) {
      console.error(`Data directory does not exist or is not accessible: ${dataDir}`);
      console.error(`Error: ${error.message}`);
      return [];
    }
    
    const files = await fs.promises.readdir(dataDir);
    console.log(`Found ${files.length} files in data directory:`, files);
    
    const movieData = [];

    const jsonFiles = files.filter(file => file.endsWith('.json'));
    if (jsonFiles.length === 0) {
      console.error("No JSON files found in data directory");
      return [];
    }

    // Check each file for Lord of the Rings
    let lotrFound = false;
    
    for (const file of jsonFiles) {
      const filePath = join(dataDir, file);
      console.log(`Reading file: ${filePath}`);
      
      try {
        const rawData = await readFile(filePath, 'utf8');
        const data = JSON.parse(rawData);
        
        // Log if we found LOTR
        if (
          data.movie_name && 
          (data.movie_name.toLowerCase().includes('lord of the rings') || 
           data.movie_name.toLowerCase().includes('lotr') ||
           data.movie_id && data.movie_id.toLowerCase().includes('lord_of_the_rings'))
        ) {
          console.log(`✅ Found Lord of the Rings movie in ${file}`);
          lotrFound = true;
        }
        
        if (!data.reviews || !Array.isArray(data.reviews) || data.reviews.length === 0) {
          console.warn(`Warning: Movie data in ${file} is missing reviews or has empty reviews array`);
          data.reviews = data.reviews || [
            { text: "Sample review for testing purposes." },
            { text: "Another sample review with sci-fi and adventure keywords." }
          ];
          console.log("Added sample reviews for testing");
        } else {
          console.log(`Found ${data.reviews.length} reviews for ${data.movie_name || 'unknown movie'}`);
        }
        
        movieData.push(data);
      } catch (error) {
        console.error(`Error reading or parsing ${file}:`, error.message);
      }
    }

    if (!lotrFound) {
      console.warn("⚠️ Lord of the Rings movie not found in any of the data files. Creating a sample LOTR movie for testing.");
      
      // Create a sample LOTR movie
      const sampleLotr = {
        movie_id: "the_lord_of_the_rings_the_return_of_the_king",
        movie_name: "The Lord of the Rings: The Return of the King",
        imdbRating: 9.0,
        releaseYear: 2003,
        duration: 201,
        popularityScore: 0.95,
        reviews: [
          { 
            text: "The final chapter of the epic fantasy trilogy brings a satisfying conclusion to the quest to destroy the One Ring. Featuring breathtaking battles, magical creatures, and emotional character arcs."
          },
          {
            text: "An incredible fantasy adventure with hobbits, elves, dwarves and men fighting against the forces of darkness. The world-building and mythology is unparalleled in cinema."
          },
          {
            text: "Peter Jackson's masterpiece brings Middle-earth to life with stunning visuals, epic battles, and powerful performances. The story of friendship, courage, and sacrifice resonates deeply."
          },
          {
            text: "The journey of Frodo and Sam to Mount Doom is filled with danger and challenges. The battle scenes at Minas Tirith and the Black Gate are incredible feats of filmmaking."
          }
        ]
      };
      
      movieData.push(sampleLotr);
      console.log("Added sample Lord of the Rings movie for testing");
    }

    console.log(`Successfully loaded ${movieData.length} movies`);
    return movieData;
  } catch (error) {
    console.error('Error loading movie data:', error);
    console.error(error.stack);
    return [];
  }
}

async function testLotrRecommendation() {
  try {
    console.log("\n========== TESTING LORD OF THE RINGS MATCHING ==========");
    
    // Input specifically crafted to match LOTR
    const userInput = {
      freeText: "I'm looking for an epic fantasy adventure with magic, elves, dwarves and great battles. I want to see a story about a perilous quest where a group of heroes fights against evil forces. I enjoy films with detailed world-building and mythology.",
      age: 25,
      gender: "any",
      preferredDuration: 180,
      preferredLanguage: "English",
    };

    console.log('\nTargeted input for Lord of the Rings:');
    console.log(JSON.stringify(userInput, null, 2));

    // Process the recommendation
    const recommender = new Recommender();
    const movieDatabase = await loadMovieData();
    
    if (!movieDatabase || movieDatabase.length === 0) {
      console.error("No movie data available to process recommendations. Aborting test.");
      return;
    }

    console.log('\nProcessing recommendation request...');
    
    // Process user input
    const userProcessor = new UserInputProcessor();
    const processedInput = await userProcessor.processUserInput(userInput);
    
    console.log('\nProcessed Input:');
    console.log(JSON.stringify(processedInput.processedInput, null, 2));
    
    console.log('\nTop vector terms by weight:');
    const sortedTerms = Object.entries(processedInput.vector)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15); 
      
    sortedTerms.forEach(([term, weight]) => {
      console.log(`${term}: ${weight.toFixed(4)}`);
    });

    // Get recommendations
    const recommendations = await recommender.getRecommendations(processedInput, movieDatabase, {
      maxResults: 5,
      similarityThreshold: 0.01,
      includeMetadata: true
    });

    // Check if LOTR is in the recommendations
    const lotrRec = recommendations.find(rec => 
      rec.movieName && (
        rec.movieName.toLowerCase().includes('lord of the rings') || 
        rec.movieName.toLowerCase().includes('lotr') ||
        rec.movieId && rec.movieId.toLowerCase().includes('lord_of_the_rings')
      )
    );

    console.log('\nTOP RECOMMENDATIONS:');
    console.log(JSON.stringify(recommendations, null, 2));

    if (lotrRec) {
      console.log('\n✅ SUCCESS: Lord of the Rings was recommended!');
      console.log(`Position: ${recommendations.indexOf(lotrRec) + 1} of ${recommendations.length}`);
      console.log(`Similarity Score: ${lotrRec.similarity}`);
      console.log(`Final Score: ${lotrRec.finalScore}`);
      
      if (recommendations.indexOf(lotrRec) === 0) {
        console.log('🎯 PERFECT MATCH: Lord of the Rings was the top recommendation!');
      }
    } else {
      console.log('\n❌ FAILED: Lord of the Rings was not in the recommendations list');
      
      // Find all LOTR movies in the database
      const lotrMovies = movieDatabase.filter(movie => 
        movie.movie_name && (
          movie.movie_name.toLowerCase().includes('lord of the rings') || 
          movie.movie_name.toLowerCase().includes('lotr') ||
          movie.movie_id && movie.movie_id.toLowerCase().includes('lord_of_the_rings')
        )
      );
      
      if (lotrMovies.length > 0) {
        console.log(`Found ${lotrMovies.length} Lord of the Rings movies in the database:`);
        lotrMovies.forEach(movie => {
          console.log(`- ${movie.movie_name} (ID: ${movie.movie_id})`);
        });
      } else {
        console.log('No Lord of the Rings movies found in the database.');
      }
    }
    
    console.log("\n========== TEST COMPLETE ==========");
  } catch (error) {
    console.error('Test failed:', error);
    console.error(error.stack);
  }
}

console.log("Starting Lord of the Rings matching test...");
await testLotrRecommendation(); 