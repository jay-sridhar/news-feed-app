import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const { url } = req.query

  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'Missing url parameter' })
    return
  }

  // Only allow fetching from Google News RSS to prevent open-proxy abuse
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    res.status(400).json({ error: 'Invalid url parameter' })
    return
  }

  if (!parsed.hostname.endsWith('news.google.com')) {
    res.status(403).json({ error: 'Only news.google.com URLs are allowed' })
    return
  }

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsFlow/1.0)' },
      signal: AbortSignal.timeout(10_000),
    })

    const contentType = upstream.headers.get('content-type') ?? 'application/xml'
    const contents = await upstream.text()

    res.status(200).json({
      contents,
      status: {
        url,
        content_type: contentType,
        http_code: upstream.status,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upstream fetch failed'
    res.status(502).json({ error: message })
  }
}
