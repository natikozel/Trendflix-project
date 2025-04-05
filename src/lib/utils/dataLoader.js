import fs from 'fs';
import path from 'path';
import { normalizeMovieData } from './movieDataProcessor.js';

/**
 * Load movie data from JSON files in a directory
 */
export function loadMovieDataFromDirectory(directoryPath) {
  try {
    // Get all JSON files in the directory
    const files = fs.readdirSync(directoryPath).filter(file => file.endsWith('.json'));
    console.log(`Found ${files.length} JSON files in ${directoryPath}`);
    
    // Process each file
    const movies = [];
    
    for (const file of files) {
      try {
        const filePath = path.join(directoryPath, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const movieData = JSON.parse(fileContent);
        
        // Normalize the data
        const normalizedData = normalizeMovieData(movieData, file);
        
        movies.push({
          data: normalizedData,
          source: file
        });
      } catch (error) {
        console.error(`Error loading movie data from ${file}:`, error);
      }
    }
    
    console.log(`Successfully loaded ${movies.length} movies`);
    return movies;
  } catch (error) {
    console.error(`Error loading movie data from directory ${directoryPath}:`, error);
    return [];
  }
} 