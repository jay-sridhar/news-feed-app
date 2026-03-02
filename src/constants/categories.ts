import type { Category, UserRegion } from '../types'

const BASE = 'https://news.google.com/rss'

export const INDIA_STATES: { value: string; city: string }[] = [
  { value: 'Andhra Pradesh', city: 'Vijayawada' },
  { value: 'Delhi', city: 'New Delhi' },
  { value: 'Gujarat', city: 'Ahmedabad' },
  { value: 'Haryana', city: 'Gurugram' },
  { value: 'Karnataka', city: 'Bengaluru' },
  { value: 'Kerala', city: 'Thiruvananthapuram' },
  { value: 'Madhya Pradesh', city: 'Bhopal' },
  { value: 'Maharashtra', city: 'Mumbai' },
  { value: 'Odisha', city: 'Bhubaneswar' },
  { value: 'Punjab', city: 'Chandigarh' },
  { value: 'Rajasthan', city: 'Jaipur' },
  { value: 'Tamil Nadu', city: 'Chennai' },
  { value: 'Telangana', city: 'Hyderabad' },
  { value: 'Uttar Pradesh', city: 'Lucknow' },
  { value: 'West Bengal', city: 'Kolkata' },
]

export const DEFAULT_USER_REGION: UserRegion = { country: 'India', state: 'Tamil Nadu' }

export function buildCategories(region: UserRegion): Category[] {
  const stateEntry =
    INDIA_STATES.find((s) => s.value === region.state) ?? { value: region.state, city: region.state }
  const q = encodeURIComponent(`${stateEntry.value} OR ${stateEntry.city}`)

  return [
    {
      id: 'top',
      label: 'Top Stories',
      feedUrl: `${BASE}?hl=en-IN&gl=IN&ceid=IN:en`,
      order: 0,
    },
    {
      id: 'national',
      label: 'National – India',
      feedUrl: `${BASE}/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNRFZ4ZERBU0FtVnVLQUFQAQ?hl=en-IN&gl=IN&ceid=IN:en`,
      order: 1,
    },
    {
      id: 'international',
      label: 'International',
      feedUrl: `${BASE}/search?q=world+news+OR+geopolitics+OR+United+States+OR+China+OR+Russia+OR+Europe+OR+Middle+East+OR+United+Nations&hl=en-IN&gl=IN&ceid=IN:en`,
      order: 2,
    },
    {
      id: 'regional',
      label: `Regional – ${stateEntry.value}`,
      feedUrl: `${BASE}/search?q=${q}&hl=en-IN&gl=IN&ceid=IN:en`,
      order: 3,
    },
    {
      id: 'tech',
      label: 'Technology',
      feedUrl: `${BASE}/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pKVGlnQVAB?hl=en-IN&gl=IN&ceid=IN:en`,
      order: 4,
    },
    {
      id: 'ai',
      label: 'Artificial Intelligence',
      feedUrl: `${BASE}/search?q=artificial+intelligence+OR+ChatGPT+OR+machine+learning+OR+Gemini&hl=en-IN&gl=IN&ceid=IN:en`,
      order: 5,
    },
    {
      id: 'business',
      label: 'Business & Stocks',
      feedUrl: `${BASE}/search?q=stock+market+OR+BSE+OR+NSE+OR+Sensex+OR+Nifty+OR+Indian+economy&hl=en-IN&gl=IN&ceid=IN:en`,
      order: 6,
    },
    {
      id: 'weather',
      label: 'Weather',
      feedUrl: `${BASE}/search?q=weather+India+OR+monsoon+OR+cyclone+OR+IMD+forecast&hl=en-IN&gl=IN&ceid=IN:en`,
      order: 7,
    },
    {
      id: 'sports',
      label: 'Sports',
      feedUrl: `${BASE}/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtVnVHZ0pKVGlnQVAB?hl=en-IN&gl=IN&ceid=IN:en`,
      order: 8,
    },
    {
      id: 'science',
      label: 'Science',
      feedUrl: `${BASE}/search?q=science+OR+space+OR+research+OR+ISRO+OR+discovery&hl=en-IN&gl=IN&ceid=IN:en`,
      order: 9,
    },
    {
      id: 'education',
      label: 'Education',
      feedUrl: `${BASE}/search?q=education+India+OR+school+OR+college+OR+university+OR+exam+OR+NEET+JEE&hl=en-IN&gl=IN&ceid=IN:en`,
      order: 10,
    },
    {
      id: 'showbiz',
      label: 'Media & Show-Biz',
      feedUrl: `${BASE}/search?q=Bollywood+OR+entertainment+OR+OTT+OR+celebrity+OR+movies+OR+web+series&hl=en-IN&gl=IN&ceid=IN:en`,
      order: 11,
    },
    {
      id: 'literature',
      label: 'Literature',
      feedUrl: `${BASE}/search?q=books+OR+literature+OR+fiction+OR+novel+OR+author+OR+publishing&hl=en-IN&gl=IN&ceid=IN:en`,
      order: 12,
    },
    {
      id: 'religion',
      label: 'Religion',
      feedUrl: `${BASE}/search?q=religion+India+OR+temple+OR+mosque+OR+church+OR+festival+OR+spiritual&hl=en-IN&gl=IN&ceid=IN:en`,
      order: 13,
    },
  ]
}

// Static list built from the default region — used for category ID validation only
export const CATEGORIES: Category[] = buildCategories(DEFAULT_USER_REGION)

export const CATEGORY_MAP: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
)
