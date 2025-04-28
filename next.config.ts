import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.ignoreWarnings = [
        { module: /node_modules/ },
        { file: /node_modules/ },
    ];
    config.stats = {
        warnings: false,
        errors: false,
      };
  
      return config;
    },
    silent: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
      {
        protocol: 'https',
        hostname: 'images-na.ssl-images-amazon.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'images.metacritic.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/vi/**',
      },
    ],
  },
}

export default nextConfig;
