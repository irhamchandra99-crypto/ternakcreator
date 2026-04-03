/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  experimental: {
    allowedDevOrigins: ['192.168.193.206'],
  },
};

export default nextConfig;