/** @type {import('next').NextConfig} */
const nextConfig = {
 eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Optional: allow builds to complete even with TypeScript errors
    ignoreBuildErrors: true,
  },
  rules: {
    "@typescript-eslint/no-unused-vars": "off",
  },
  
  // Add this if not present
  transpilePackages: [],
};

module.exports = nextConfig;
