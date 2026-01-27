import { NextResponse } from 'next/server';

const UPSTREAM_BASE_URL = process.env.PEPSOMETER_API_URL || 'https://pepsometerapi.fun';

export const dynamic = 'force-dynamic';

/**
 * GET /api/attempts/[id]
 * Fetches an attempt by ID from the backend API
 * 
 * Note: This assumes the backend API has an endpoint to fetch attempts by ID.
 * If not available, the frontend will fall back to IndexedDB (same-device only).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  if (!id) {
    return NextResponse.json(
      { error: 'Attempt ID is required' },
      { status: 400 }
    );
  }

  try {
    // Try to fetch from backend API
    // Adjust the endpoint path based on your backend API structure
    const upstreamUrl = new URL(`/attempts/${id}`, UPSTREAM_BASE_URL);

    const res = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      });
    }

    // If backend doesn't have the attempt, return 404
    if (res.status === 404) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }

    // For other errors, return the error from upstream
    const errorData = await res.text();
    return NextResponse.json(
      { error: 'Failed to fetch attempt', details: errorData },
      { status: res.status }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Upstream request failed';
    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}

