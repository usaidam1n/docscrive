import { NextResponse } from 'next/server';
import { github } from '../../../../../lib/config';

export async function GET() {
  return NextResponse.json({
    isConfigured: github.isConfigured,
    clientId: github.clientId, // This is safe to expose (it's public anyway)
    redirectUri: github.redirectUri,
    scopes: github.scopes,
  });
}
