import { NextResponse } from 'next/server';

const OCM_BASE_URL = 'https://api.openchargemap.io/v3';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const apiKey = process.env.NEXT_PUBLIC_OCM_API_KEY || process.env.OCM_API_KEY || '';

  if (!apiKey) {
    return NextResponse.json(
      { error: 'OCM API key not configured. Set NEXT_PUBLIC_OCM_API_KEY in .env.local' },
      { status: 503 }
    );
  }

  const url = new URL(`${OCM_BASE_URL}/poi`);
  // Forward all query params from the client request
  searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });
  // Always inject the API key server-side — never expose it in client requests
  url.searchParams.set('key', apiKey);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'X-API-Key': apiKey,
        'User-Agent': 'ChargeAhead-EV-App/1.0',
        'Accept': 'application/json',
      },
      next: { revalidate: 300 }, // Cache on server for 5 minutes
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[OCM Proxy] ${res.status} — ${body}`);
      return NextResponse.json(
        { error: `OCM API error ${res.status}`, detail: body },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err: any) {
    console.error('[OCM Proxy] Fetch failed:', err.message);
    return NextResponse.json({ error: err.message || 'OCM fetch failed' }, { status: 500 });
  }
}
