/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: { unoptimized: true },
  experimental: { serverComponentsExternalPackages: ['puppeteer', 'pdfkit', 'pg'] },
};
module.exports = nextConfig;
