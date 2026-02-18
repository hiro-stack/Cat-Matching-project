/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:8000/api/:path*',
      },
      {
        source: '/django-admin/:path*',
        destination: 'http://backend:8000/django-admin/:path*',
      },
      {
        source: '/django-admin',
        destination: 'http://backend:8000/django-admin/',
      },
      {
        source: '/media/:path*',
        destination: 'http://backend:8000/media/:path*',
      },
    ]
  },
}

module.exports = nextConfig
