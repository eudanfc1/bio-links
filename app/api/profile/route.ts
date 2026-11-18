import { NextResponse } from 'next/server';
import { getBundle, ensureSeed } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'Parâmetro slug obrigatório.' }, { status: 400 });

  // Garante seed na primeira requisição (apenas em dev / file store).
  await ensureSeed();

  const bundle = await getBundle(slug);
  if (!bundle) return NextResponse.json({ error: 'Página não encontrada.' }, { status: 404 });

  const { profile, links, stories, notice } = bundle;

  return NextResponse.json({
    profile: {
      ...profile,
      theme: profile.theme,
    },
    links: links.map(({ id, label, url, kind, icon, position, active }) => ({ id, label, url, kind, icon, position, active })),
    stories: stories.map(({ id, mediaUrl, mediaType, caption, createdAt, expiresAt }) => ({ id, mediaUrl, mediaType, caption, createdAt, expiresAt })),
    notice: notice
      ? { ...notice }
      : null,
  });
}
