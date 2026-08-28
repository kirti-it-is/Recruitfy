import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/mock-db';
import { ApiResponse, HiringRoom, UpdateRoomInput } from '@/lib/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const room = await db.getRoomById(roomId);

    if (!room) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Hiring room with ID '${roomId}' was not found.`,
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<HiringRoom> = {
      success: true,
      data: room,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch hiring room',
        details: error instanceof Error ? error.message : String(error),
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = (await req.json()) as UpdateRoomInput;

    const updated = await db.updateRoom(roomId, body);
    if (!updated) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Hiring room with ID '${roomId}' was not found.`,
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<HiringRoom> = {
      success: true,
      data: updated,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update hiring room',
        details: error instanceof Error ? error.message : String(error),
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const deleted = await db.deleteRoom(roomId);

    if (!deleted) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Hiring room with ID '${roomId}' was not found.`,
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<{ deleted: boolean }> = {
      success: true,
      data: { deleted: true },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete hiring room',
        details: error instanceof Error ? error.message : String(error),
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
