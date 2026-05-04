import { createClient } from '@supabase/supabase-js'

export type PropertyType =
  | 'villa_with_pool'
  | 'villa_without_pool'
  | 'open_event_space'
  | 'lodging'
  | 'auditorium'
  | 'river_frontage'
  | 'heritage_home'
  | 'resort'

export type EventType =
  | 'staycation'
  | 'family_gathering'
  | 'wedding'
  | 'corporate'
  | 'birthday'
  | 'retreat'

export type PropertyAttributes = {
  property_id: string
  room_count: number
  bathroom_count: number
  max_guests_overnight: number
  max_guests_day_event: number
  has_pool: boolean
  has_ac_hall: boolean
  ac_hall_capacity: number
  has_non_ac_hall: boolean
  non_ac_hall_capacity: number
  has_open_lawn: boolean
  open_lawn_sqft: number
  has_kitchen: boolean
  has_parking: boolean
  parking_count: number
  has_generator: boolean
  alcohol_allowed: boolean
  outside_catering: boolean
}

export type Property = {
  id: string
  name: string
  slug: string
  tagline: string
  description: string
  property_type: PropertyType
  owner_whatsapp: string
  owner_name: string
  price_guide: string
  photos: string[]
  is_active: boolean
  is_featured: boolean
  sort_order: number
  map_pin_x: number
  map_pin_y: number
  maps_url: string
  instagram_url: string
  created_at: string
  property_attributes?: PropertyAttributes
  property_event_types?: { event_type: string }[]
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  villa_with_pool: 'Villa with Pool',
  villa_without_pool: 'Villa without Pool',
  open_event_space: 'Open Event Space',
  lodging: 'Lodging / Rooms',
  auditorium: 'Auditorium',
  river_frontage: 'River Frontage',
  heritage_home: 'Heritage / Tharavadu',
  resort: 'Resort',
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  staycation: 'Staycation',
  family_gathering: 'Family Gathering',
  wedding: 'Wedding',
  corporate: 'Corporate Event',
  birthday: 'Birthday Party',
  retreat: 'Retreat',
}

export const EVENT_TYPES: EventType[] = [
  'staycation',
  'family_gathering',
  'wedding',
  'corporate',
  'birthday',
  'retreat',
]

export const PROPERTY_TYPES: PropertyType[] = [
  'villa_with_pool',
  'villa_without_pool',
  'open_event_space',
  'lodging',
  'auditorium',
  'river_frontage',
  'heritage_home',
  'resort',
]

export type VendorCategory =
  | 'event_management'
  | 'photography_video'
  | 'catering'
  | 'decoration_florals'
  | 'beauty_styling'

export type Vendor = {
  id: string
  name: string
  slug: string
  category: VendorCategory
  tagline: string
  description: string
  whatsapp: string
  phone: string
  instagram_url: string
  photos: string[]
  price_guide: string
  area_served: string
  is_active: boolean
  is_featured: boolean
  created_at: string
}

export type VendorSubmission = {
  id: string
  name: string
  category: VendorCategory
  tagline: string
  description: string
  whatsapp: string
  phone: string
  email: string
  instagram_url: string
  price_guide: string
  area_served: string
  message: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export const VENDOR_CATEGORY_LABELS: Record<VendorCategory, string> = {
  event_management: 'Event Management',
  photography_video: 'Photography & Video',
  catering: 'Catering',
  decoration_florals: 'Decoration & Florals',
  beauty_styling: 'Beauty & Styling',
}

export const VENDOR_CATEGORIES: VendorCategory[] = [
  'event_management',
  'photography_video',
  'catering',
  'decoration_florals',
  'beauty_styling',
]

export const VENDOR_CATEGORY_ICONS: Record<VendorCategory, string> = {
  event_management: 'ðŸŽª',
  photography_video: 'ðŸ“¸',
  catering: 'ðŸ½ï¸',
  decoration_florals: 'ðŸŒ¸',
  beauty_styling: 'ðŸ’„',
}
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Service role client â€” only used in API routes (server-side)
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

