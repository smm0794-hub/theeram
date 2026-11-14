import { MetadataRoute } from 'next'
import { createServiceClient } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.theeramspaces.in'

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/list`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/join`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
  ]

  try {
    const supabase = createServiceClient()

    const { data: towns } = await supabase
      .from('towns')
      .select('slug, created_at')
      .eq('is_active', true)

    const townPages: MetadataRoute.Sitemap = (towns ?? [])
      .filter((t) => t.slug !== 'pala')
      .map((t) => ({
        url: `${baseUrl}/${t.slug}`,
        lastModified: t.created_at ? new Date(t.created_at) : new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      }))

    const { data: properties } = await supabase
      .from('properties')
      .select('slug, created_at')
      .eq('is_active', true)

    const propertyPages: MetadataRoute.Sitemap = (properties ?? []).map((p) => ({
      url: `${baseUrl}/property/${p.slug}`,
      lastModified: new Date(p.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    const { data: vendors } = await supabase
      .from('vendors')
      .select('slug, created_at')
      .eq('is_active', true)

    const vendorPages: MetadataRoute.Sitemap = (vendors ?? []).map((v) => ({
      url: `${baseUrl}/vendor/${v.slug}`,
      lastModified: new Date(v.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    return [...staticPages, ...townPages, ...propertyPages, ...vendorPages]
  } catch {
    return staticPages
  }
}
