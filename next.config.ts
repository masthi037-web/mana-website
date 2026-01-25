import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'github.com' },
      { protocol: 'https', hostname: 'cdn.example.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'dummyimage.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'img.freepik.com' }, // Whitelist Freepik
      { protocol: 'https', hostname: 'static.vecteezy.com' }, // Whitelist Vecteezy
      { protocol: 'https', hostname: 'storage.googleapis.com' }, // Whitelist GCS
      { protocol: 'https', hostname: 'png.pngtree.com' }, // Whitelist PngTree
      { protocol: 'https', hostname: 'i.pinimg.com' },
      { protocol: 'https', hostname: 't3.ftcdn.net' },
      { protocol: 'https', hostname: 't4.ftcdn.net' },
    ],
  },
  serverExternalPackages: [
    'google-auth-library',
    '@genkit-ai/google-genai',
    '@genkit-ai/next',
    'genkit',
  ],
};

export default nextConfig;
