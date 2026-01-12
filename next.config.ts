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
