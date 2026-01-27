import { NextResponse } from 'next/server';

const UPSTREAM_BASE_URL = process.env.PEPSOMETER_API_URL || 'https://pepsometerapi.fun';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const upstreamUrl = new URL('/locations', UPSTREAM_BASE_URL);

  // Pass through paging params if provided
  const page = searchParams.get('page');
  const perPage = searchParams.get('per_page');
  if (page) upstreamUrl.searchParams.set('page', page);
  if (perPage) upstreamUrl.searchParams.set('per_page', perPage);

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



