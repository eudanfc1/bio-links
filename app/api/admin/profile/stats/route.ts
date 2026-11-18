import { NextResponse } from 'next/server';
import { summarizeClicks } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const days = parseInt(searchParams.get('days') || '7', 10);

  if (!slug) return NextResponse.json({ error: 'slug obrigatório' }, { status: 400 });

  // Need to get the profile id from slug.
  const { getProfileBySlug } = await import('@/lib/store');
  const profile = await getProfileBySlug(slug);
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const result = await summarizeClicks(profile.id, { days });
  return NextResponse.json(result);
}
