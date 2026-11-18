import { NextResponse } from 'next/server';
import { recordClick } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const { profileId, linkId, target } = body as {
    profileId?: string;
    linkId?: string | null;
    target?: string;
  };

  if (!profileId || !target) {
    return NextResponse.json({ error: 'profileId e target são obrigatórios.' }, { status: 400 });
  }

  await recordClick({
    profileId,
    linkId: linkId ?? null,
    target,
    createdAt: new Date().toISOString(),
    referrer: request.headers.get('referer') ?? '',
    userAgent: request.headers.get('user-agent') ?? '',
  });

  return NextResponse.json({ ok: true });
}
