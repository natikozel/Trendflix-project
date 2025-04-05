import { Suspense } from 'react';
import MovieHero from '@/components/movie/MovieHero';
import MovieDetails from '@/components/movie/MovieDetails';
import SimilarMovies from '@/components/movie/SimilarMovies';
import { Skeleton } from '@/components/ui/Skeleton';
import movieDatabaseService from '@/lib/db/services/MovieDatabaseService';

// Function to get TMDB poster URL
async function getTMDBPoster(movieName: string, year?: number): Promise<string | null> {
  try {
    // First, search for the movie with additional parameters
    const searchResponse = await fetch(
      `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(movieName)}${year ? `&year=${year}` : ''}&language=en-US`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.TMDB_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const searchData = await searchResponse.json();
    let poster 
    if (searchData.results.length > 1)
      poster = searchData.results.sort((a,b) => b.popularity - a.popularity)[0].poster_path
    else
      poster = searchData.results[0]
    if (searchData.results && poster) {
      // Construct the full poster URL
      return `https://image.tmdb.org/t/p/original${poster}`;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching TMDB poster:', error);
    return null;
  }
}

// Dummy movie data with async poster fetch
async function getDummyMovie(): Promise<Movie> {
  const posterUrl = await getTMDBPoster("Lord of the rings", 2001) || "/placeholder-poster.svg";
  
  return {
    movie_id: "1",
    movie_name: "Interstellar",
    posterUrl, // This will be the TMDB poster URL
    rating: 8.6,
    releaseYear: 2014,
    duration: 169,
    genres: ["Sci-Fi", "Adventure", "Drama", "Space"],
    synopsis: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival. When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.",
    reviews: [
      {
        rating: 9,
        text: "A masterpiece of science fiction that combines stunning visuals with deep emotional resonance. Christopher Nolan's direction is at its finest here."
      },
      {
        rating: 8,
        text: "The visual effects are groundbreaking, and the scientific concepts are presented in an engaging way. The emotional core of the story is powerful."
      },
      {
        rating: 8.5,
        text: "A thought-provoking journey through space and time that explores complex themes of love, sacrifice, and humanity's place in the universe."
      }
    ],
    popularity: 0.95
  };
}


function MovieDetailsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="md:col-span-2 space-y-8">
          <div>
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div>
            <Skeleton className="h-8 w-32 mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
        <div className="space-y-8">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

// Make the component async
export default async function MoviePage({ params }: { params: { id: string } }) {
  // Fetch the movie from the database using the ID
  const movie = await movieDatabaseService.getMovie(params.id);
  
  // If movie not found, use a dummy movie (or you could show a not found page)
  if (!movie) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold">Movie not found</h1>
        <p>The requested movie could not be found.</p>
      </div>
    );
  }

  return (
    <main>
      <MovieHero movie={movie} />
      <Suspense fallback={<MovieDetailsSkeleton />}>
        <MovieDetails movie={movie} />
      </Suspense>
      <SimilarMovies movieId={movie.movieId} />
    </main>
  );
}



