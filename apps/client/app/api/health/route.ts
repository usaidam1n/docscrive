import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Docker, load balancers, and monitoring.
 * Used by apps/client/Dockerfile HEALTHCHECK.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'docscrive-client',
    },
    { status: 200 }
  );
}
