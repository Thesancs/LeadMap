import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string[] }> }
) {
  try {
    const { name } = await params;
    const photoName = name.join('/');
    const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

    if (!GOOGLE_PLACES_API_KEY) {
      return new NextResponse('API Key not configured', { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const maxWidthPx = searchParams.get('maxWidthPx') || '400';

    const url = `https://places.googleapis.com/v1/${photoName}/media?key=${GOOGLE_PLACES_API_KEY}&maxWidthPx=${maxWidthPx}`;

    const response = await fetch(url);

    if (!response.ok) {
      return new NextResponse('Failed to fetch image', { status: response.status });
    }

    const blob = await response.blob();
    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

    return new NextResponse(blob, { headers });
  } catch (error) {
    console.error('Error proxying photo:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
