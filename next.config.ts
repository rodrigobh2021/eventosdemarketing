import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['playwright'],
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
