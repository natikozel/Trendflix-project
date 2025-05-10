import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/components/StoreProvider";

export const metadata: Metadata = {
  title: "Trendflix - Personalized Movie Recommendations",
  description: "Discover movies tailored to your preferences with Trendflix's advanced recommendation engine",
  keywords: "movies, recommendations, personalized, films, cinema, entertainment",
  authors: [{ name: "Trendflix Team" }],
  viewport: "width=device-width, initial-scale=1",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-gray-950 text-gray-50 min-h-screen">
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
