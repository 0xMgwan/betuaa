import { NextResponse } from 'next/server';

const POLYMARKET_API_BASE = 'https://gamma-api.polymarket.com';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '100';
    const active = searchParams.get('active') === 'true';
    const closed = searchParams.get('closed') === 'true';

    const params = new URLSearchParams({
      active: active.toString(),
      closed: closed.toString(),
      limit,
    });

    const response = await fetch(
      `${POLYMARKET_API_BASE}/events?${params}`,
      { next: { revalidate: 300 } }
    );

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Add cache headers
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching Polymarket events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
