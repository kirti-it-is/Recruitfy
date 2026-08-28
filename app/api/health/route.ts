import { NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/types';

export async function GET() {
  const response: ApiResponse<{ status: string; uptime: number }> = {
    success: true,
    data: {
      status: 'operational',
      uptime: process.uptime(),
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  return NextResponse.json(response);
}
