/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['sharp', '@imgly/background-removal-node'],
  async redirects() {
    return [
      {
        source: '/link',
        destination: '/links',
        permanent: true,
      },
      {
        source: '/bio',
        destination: '/links',
        permanent: true,
      },
      {
        source: '/socials',
        destination: '/links',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
