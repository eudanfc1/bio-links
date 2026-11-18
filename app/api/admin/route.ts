import { NextResponse } from 'next/server';
import { getBundle, getProfileBySlug, listProfiles, listLinks, listPartners, savePartner, deletePartner, listStories, saveStory, deleteStory, getActiveNotice, saveNotice, ensureSeed } from '@/lib/store';
import type { Partner } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  await ensureSeed();
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (slug) {
    const bundle = await getBundle(slug);
    if (!bundle) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const { profile, links, partners, stories, notice } = bundle;
    return NextResponse.json({
      profile: {
        ...profile,
        theme: (profile.theme as Record<string, unknown>) ?? {},
      },
      links,
      partners,
      stories,
      notice: notice ?? null,
    });
  }

  const profiles = await listProfiles();
  return NextResponse.json({ profiles });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { action, slug, data } = body as { action: string; slug?: string; data?: Record<string, unknown> };

  switch (action) {
    case 'updateProfile': {
      if (!slug || !data) return NextResponse.json({ error: 'slug e data são obrigatórios' }, { status: 400 });
      const existing = await getProfileBySlug(slug);
      if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      // Persist via store — need to access store directly in API route.
      const { saveProfile } = await import('@/lib/store');
      const saved = await saveProfile(updated as Parameters<typeof saveProfile>[0]);
      return NextResponse.json({ profile: saved });
    }
    case 'updateLinks': {
      if (!slug || !Array.isArray(data)) return NextResponse.json({ error: 'slug e data (array) são obrigatórios' }, { status: 400 });
      const { getProfileBySlug: gp, saveLink, deleteLink } = await import('@/lib/store');
      const p = await gp(slug);
      if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const existing = await (await import('@/lib/store')).listLinks(p.id);
      for (const link of data as Parameters<typeof saveLink>[0][]) {
        await saveLink(link);
      }
      const ids = new Set((data as Record<string, unknown>[]).map(l => (l as { id: string }).id));
      for (const ex of existing) {
        if (!ids.has(ex.id)) await deleteLink(ex.id);
      }
      return NextResponse.json({ ok: true });
    }
    case 'updateNotice': {
      if (!slug || !data) return NextResponse.json({ error: 'slug e data são obrigatórios' }, { status: 400 });
      const { getProfileBySlug: gp2, saveNotice } = await import('@/lib/store');
      const p2 = await gp2(slug);
      if (!p2) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const notice = { ...(data as object), profileId: p2.id } as Parameters<typeof saveNotice>[0];
      const saved = await saveNotice(notice);
      return NextResponse.json({ notice: saved });
    }
    case 'updatePartners': {
      if (!slug || !Array.isArray(data)) return NextResponse.json({ error: 'slug e data (array) são obrigatórios' }, { status: 400 });
      const { getProfileBySlug: gp4, savePartner, deletePartner } = await import('@/lib/store');
      const p4 = await gp4(slug);
      if (!p4) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const existing4 = await (await import('@/lib/store')).listPartners(p4.id);
      for (const partner of data as Partner[]) {
        await savePartner({ ...partner, profileId: p4.id });
      }
      const ids4 = new Set((data as Record<string, unknown>[]).map(l => (l as { id: string }).id));
      for (const ex of existing4) {
        if (!ids4.has(ex.id)) await deletePartner(ex.id);
      }
      return NextResponse.json({ ok: true });
    }
    case 'updateStories': {
      if (!slug || !Array.isArray(data)) return NextResponse.json({ error: 'slug e data (array) são obrigatórios' }, { status: 400 });
      const { getProfileBySlug: gp3, saveStory, deleteStory } = await import('@/lib/store');
      const p3 = await gp3(slug);
      if (!p3) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const existing3 = await (await import('@/lib/store')).listStories(p3.id);
      for (const story of data as Parameters<typeof saveStory>[0][]) {
        await saveStory(story);
      }
      const ids3 = new Set((data as Record<string, unknown>[]).map(s => (s as { id: string }).id));
      for (const ex of existing3) {
        if (!ids3.has(ex.id)) await deleteStory(ex.id);
      }
      return NextResponse.json({ ok: true });
    }
    default:
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  }
}
