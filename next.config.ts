/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server features (API routes for feedback + admin) require a running
  // server, so we no longer use `output: 'export'` (static-only).
  allowedDevOrigins: ['192.168.193.206', '100.125.170.2'],
};

export default nextConfig;