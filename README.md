# Trendflix

A movie recommendation platform that helps users discover films tailored to their preferences.

## Features

- Personalized movie recommendations based on user preferences
- Advanced filtering by genre, year, and duration
- Detailed movie information including cast, plot, and reviews
- Interactive UI with responsive design

## Tech Stack

- Next.js 15
- React 19
- TailwindCSS
- Framer Motion
- Redux Toolkit

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env.local` file with:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. Initialize the movie database:
   ```bash
   npm run init-db
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `/src/app` - Next.js app router pages
- `/src/components` - Reusable UI components
- `/src/algorithm` - Recommendation engine
- `/src/lib` - Utilities and database services
- `/src/data` - Static data and models

## License

MIT
