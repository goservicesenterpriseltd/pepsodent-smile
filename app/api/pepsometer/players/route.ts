import { NextResponse } from 'next/server';

const UPSTREAM_BASE_URL = process.env.PEPSOMETER_API_URL || 'https://pepsometerapi.fun';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const upstreamUrl = new URL('/players', UPSTREAM_BASE_URL);

  // Pass through all query params (location_id, page, per_page, etc.)
  searchParams.forEach((value, key) => {
    upstreamUrl.searchParams.set(key, value);
  });

  try {
    console.log('Fetching players from:', upstreamUrl.toString());
    const res = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    const text = await res.text();
    
    // Log error responses for debugging
    if (!res.ok) {
      console.error('Players API error:', {
        status: res.status,
        statusText: res.statusText,
        url: upstreamUrl.toString(),
        body: text.substring(0, 500), // First 500 chars
      });
    }
    
    return new NextResponse(text, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    console.error('Players API fetch error:', e);
    const message = e instanceof Error ? e.message : 'Upstream request failed';
    return NextResponse.json({ status: false, message }, { status: 502 });
  }
}

