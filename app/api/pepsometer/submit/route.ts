import { NextResponse } from 'next/server';

const UPSTREAM_BASE_URL = process.env.PEPSOMETER_API_URL || 'https://pepsometerapi.fun';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const upstreamUrl = new URL('/submit', UPSTREAM_BASE_URL);

  try {
    const body = await request.text();

    const res = await fetch(upstreamUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
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



