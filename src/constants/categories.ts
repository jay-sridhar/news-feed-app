import type { Category } from '../types'

export const CATEGORIES: Category[] = [
  {
    id: 'top',
    label: 'Top Stories',
    feedUrl: 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en',
    order: 0,
  },
  {
    id: 'tech',
    label: 'Technology & AI',
    feedUrl:
      'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pKVGlnQVAB?hl=en-IN&gl=IN&ceid=IN:en',
    order: 1,
  },
  {
    id: 'tamilnadu',
    label: 'Tamil Nadu / Chennai',
    feedUrl:
      'https://news.google.com/rss/search?q=Tamil+Nadu+OR+Chennai&hl=en-IN&gl=IN&ceid=IN:en',
    order: 2,
  },
  {
    id: 'india',
    label: 'National India',
    feedUrl:
      'https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNRFZ4ZERBU0FtVnVLQUFQAQ?hl=en-IN&gl=IN&ceid=IN:en',
    order: 3,
  },
  {
    id: 'sports',
    label: 'Sports',
    feedUrl:
      'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtVnVHZ0pKVGlnQVAB?hl=en-IN&gl=IN&ceid=IN:en',
    order: 4,
  },
]

export const CATEGORY_MAP: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
)
