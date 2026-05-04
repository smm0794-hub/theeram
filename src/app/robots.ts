import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/curator', '/api/'],
      },
    ],
    sitemap: 'https://www.theeramspaces.in/sitemap.xml',
  }
}
