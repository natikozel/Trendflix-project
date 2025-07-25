import fs from 'fs';
import path from 'path';
import { normalizeMovieData } from './movieDataProcessor.js';

export function loadMovieDataFromDirectory(directoryPath) {
  try {
    const files = fs.readdirSync(directoryPath).filter(file => file.endsWith('.json'));
    console.log(`Found ${files.length} JSON files in ${directoryPath}`);
    
    const movies = [];
    
    for (const file of files) {
      try {
        const filePath = path.join(directoryPath, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const movieData = JSON.parse(fileContent);
        
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