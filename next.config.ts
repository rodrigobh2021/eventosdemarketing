import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['playwright'],
  images: {
    remotePatterns: [
      // Supabase Storage — event images uploaded via admin
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/eventos-marketing-:cidade',
        destination: '/cidade/:cidade',
      },
    ];
  },
};

export default nextConfig;
