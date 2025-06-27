/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizePackageImports: [ 'tesseract.js' ]
  }
};

module.exports = nextConfig;