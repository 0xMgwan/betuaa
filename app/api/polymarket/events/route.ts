import { NextResponse } from 'next/server';

const POLYMARKET_API_BASE = 'https://gamma-api.polymarket.com';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '20';
  const active = searchParams.get('active') || 'true';
  const closed = searchParams.get('closed') || 'false';

  try {
    // Use the correct query parameters as per Polymarket docs
    const url = `${POLYMARKET_API_BASE}/events?active=${active}&closed=${closed}&limit=${limit}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Polymarket events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
