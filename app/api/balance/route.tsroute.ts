
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.TELNYX_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Telnyx API key is not configured on the server.' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch('https://api.telnyx.com/v2/balance', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Telnyx could not return your balance.', details: result },
        { status: response.status }
      );
    }

    return NextResponse.json({
      balance: result.data?.balance,
      currency: result.data?.currency || 'USD',
      credit_limit: result.data?.credit_limit,
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to connect to Telnyx. Try again.' },
      { status: 502 }
    );
  }
}
