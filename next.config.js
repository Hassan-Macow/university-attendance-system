/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: undefined,
  },
  // Environment variables will be automatically available from Digital Ocean
  // No need to specify them here - they'll be injected at build time
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
