import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text') ?? 'event-checkin';

  const dataUrl = await QRCode.toDataURL(text, { margin: 1, width: 240 });
  return NextResponse.json({ qrCode: dataUrl });
}
