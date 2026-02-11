import { NextResponse } from 'next/server';

const UPSTREAM_BASE_URL = process.env.PEPSOMETER_API_URL || 'https://pepsometerapi.fun';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const upstreamUrl = new URL('/players', UPSTREAM_BASE_URL);

  // Pass through location_id param if provided
  const locationId = searchParams.get('location_id');
  if (locationId) upstreamUrl.searchParams.set('location_id', locationId);

  try {
    const res = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Upstream request failed';
    return NextResponse.json({ status: false, message }, { status: 502 });
  }
}

