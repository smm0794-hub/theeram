export const SITE_URL = 'https://www.theeramspaces.in'

/**
 * Transforms a Cloudinary image URL into a 1200x630 OG-optimized URL
 * so WhatsApp, Facebook, and X scrapers receive a fast, properly cropped image.
 */
export function cloudinaryOgImage(url?: string | null): string | undefined {
  if (!url) return undefined
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/w_1200,h_630,c_fill,q_auto,f_auto/')
  }
  return url
}
