import { NextResponse } from 'next/server';

const POLYMARKET_API_BASE = 'https://gamma-api.polymarket.com';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '20';
  const active = searchParams.get('active');
  const closed = searchParams.get('closed');
  const archived = searchParams.get('archived');

  try {
    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit);
    if (active !== null) queryParams.append('active', active);
    if (closed !== null) queryParams.append('closed', closed);
    if (archived !== null) queryParams.append('archived', archived);

    const url = `${POLYMARKET_API_BASE}/markets?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Polymarket markets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch markets' },
      { status: 500 }
    );
  }
}
