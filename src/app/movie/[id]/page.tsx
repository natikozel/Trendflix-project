import movieDatabaseService from '@/lib/db/services/MovieDatabaseService';
import defaultPoster from '@/assets/default_poster.jpg';
import MovieDetailsPage from '@/components/movie/MovieDetails';


// Transform MongoDB movie to UI-friendly format with match score data
function transformMovie(dbMovie: any) {
  if (!dbMovie) return null;
  
  // Create the UI-friendly movie object
  const movie = {
    movieId: dbMovie.movieId,
    movieName: dbMovie.movieName,
    posterUrl: dbMovie.posterUrl || '/placeholder-poster.svg',
    releaseYear: dbMovie.releaseYear,
    duration: dbMovie.duration,
    genres: dbMovie.genres || [],
    synopsis: dbMovie.synopsis || 'No synopsis available.',
    reviews: dbMovie.reviews.slice(0, 20).map((s: any) => s.text) || [],
    popularity: dbMovie.popularity,
  };
  
  return movie;
}



// Make the component async
export default async function MoviePage({ params }: { params: { id: string } }) {
  const {id} = await params;

  const dbMovie = await movieDatabaseService.getMovie(id);
  const movie = transformMovie(dbMovie);
  
  if (!movie) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold">Movie not found</h1>
        <p>The requested movie could not be found.</p>
      </div>
    );
  }
  // If the movie doesn't have a poster URL but has a name and release year, try to fetch it from TMDB
  if (!movie.posterUrl || movie.posterUrl.trim() === "") {
    const posterUrl = defaultPoster
    if (posterUrl) {
      movie.posterUrl = posterUrl;
    }
  }

  return (
    <main>
      <MovieDetailsPage movieData={movie} />
    </main>
  );
}



