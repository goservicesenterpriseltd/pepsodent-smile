import { NextRequest } from 'next/server';

const DEFAULT_ALLOWED_HOST_SUFFIXES = ['pepsometer.fun', 'pepsometerapi.fun'];

function getAllowedHostSuffixes(): string[] {
  const raw = process.env.IMAGE_PROXY_ALLOWED_HOSTS;
  if (!raw) return DEFAULT_ALLOWED_HOST_SUFFIXES;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function isAllowedHost(hostname: string, allowedSuffixes: string[]): boolean {
  const host = hostname.toLowerCase();
  return allowedSuffixes.some((suffix) => {
    const s = suffix.toLowerCase();
    return host === s || host.endsWith(`.${s}`);
  });
}

/**
 * Simple, safe-ish image proxy to avoid browser CORS/canvas-tainting issues when generating share-card PNGs.
 *
 * Usage: `/api/image-proxy?url=https%3A%2F%2F...`
 *
 * Security note: this endpoint is intentionally restricted to an allowlist of host suffixes
 * (default: `pepsometer.fun`). Configure via `IMAGE_PROXY_ALLOWED_HOSTS` (comma-separated).
 */
export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get('url');
  if (!urlParam) {
    return new Response('Missing `url` query param', { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(urlParam);
  } catch {
    return new Response('Invalid `url`', { status: 400 });
  }

  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    return new Response('Only http/https URLs are allowed', { status: 400 });
  }

  // In dev, be permissive to avoid breaking local testing.
  // In prod, restrict to an allowlist to reduce SSRF risk.
  if (process.env.NODE_ENV !== 'development') {
    const allowed = getAllowedHostSuffixes();
    if (!isAllowedHost(target.hostname, allowed)) {
      return new Response('Host not allowed', { status: 403 });
    }
  }

  const upstream = await fetch(target.toString(), {
    // Let Next cache it if it can; this is used for sharing/download flows.
    cache: 'force-cache',
  });

  if (!upstream.ok) {
    return new Response(`Upstream error (${upstream.status})`, { status: 502 });
  }

  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';
  const cacheControl = upstream.headers.get('cache-control') ?? 'public, max-age=3600';

  return new Response(upstream.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
    },
  });
}


