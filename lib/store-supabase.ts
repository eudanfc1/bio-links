import { createClient } from '@supabase/supabase-js';
import type { Profile, ProfileBundle, ProfileLink, Partner, Story, Notice, ClickEvent, ClickSummary } from './types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Cliente "frouxo": sem tipos gerados do banco, o `supabase-js` infere
 * `never` para as linhas das tabelas e quebra o build. Tipamos as tabelas
 * como `Record<string, unknown>` para manter o ergonomia.
 */
type LooseClient = {
  from(table: string): {
    select(columns?: string, options?: Record<string, unknown>): {
      eq(column: string, value: unknown): any;
      order(column: string, options?: Record<string, unknown>): any;
      gte(column: string, value: unknown): any;
      limit(count: number): any;
      maybeSingle(): Promise<{ data: any; error: any }>;
      single(): Promise<{ data: any; error: any }>;
      then(cb: (v: any) => any): any;
    };
    upsert(row: any, options?: Record<string, unknown>): any;
    insert(row: any): any;
    update(row: any): any;
    delete(): any;
  };
};

let client: LooseClient | null = null;
export function getSupabase(): LooseClient | null {
  if (!url || !anon) return null;
  if (!client) {
    client = createClient(url, anon) as unknown as LooseClient;
  }
  return client;
}

/**
 * Verifica se o Supabase está configurado.
 */
export function hasSupabase(): boolean {
  return !!getSupabase();
}

/* ================================================================== */
/* Store Supabase                                                     */
/* ================================================================== */

/** SELECT genérico para perfis públicos. */
const profileSelect = 'id, slug, name, handle, motto, bio, avatar_url, cover_url, platform, platform_label, whatsapp, instagram, telegram, verified, theme, created_at, updated_at';

/** Mapeia linha do Supabase para o tipo `Profile`. */
function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    handle: row.handle as string,
    motto: row.motto as string,
    bio: row.bio as string,
    avatarUrl: row.avatar_url as string,
    coverUrl: row.cover_url as string,
    backgroundUrl: (row.background_url as string) || '',
    partnerLogoUrl: (row.partner_logo_url as string) || '',
    partnerName: (row.partner_name as string) || '',
    platform: row.platform as string,
    platformLabel: row.platform_label as string,
    whatsapp: row.whatsapp as string,
    instagram: row.instagram as string,
    telegram: row.telegram as string,
    gamesUrl: (row.games_url as string) ?? '',
    supportUrl: (row.support_url as string) ?? '',
    verified: row.verified as boolean,
    theme: (row.theme ?? {}) as Profile['theme'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapLink(row: Record<string, unknown>): ProfileLink {
  return {
    id: row.id as string,
    profileId: row.profile_id as string,
    label: row.label as string,
    url: row.url as string,
    kind: row.kind as ProfileLink['kind'],
    icon: row.icon as string,
    backgroundUrl: (row.background_url as string) ?? null,
    position: row.position as number,
    active: row.active as boolean,
  };
}

function mapStory(row: Record<string, unknown>): Story {
  return {
    id: row.id as string,
    profileId: row.profile_id as string,
    mediaUrl: row.media_url as string,
    mediaType: row.media_type as 'image' | 'video',
    caption: row.caption as string,
    createdAt: row.created_at as string,
    expiresAt: row.expires_at as string,
  };
}

function mapNotice(row: Record<string, unknown>): Notice {
  return {
    id: row.id as string,
    profileId: row.profile_id as string,
    kicker: row.kicker as string,
    text: row.text as string,
    url: row.url as string,
    endsAt: row.ends_at as string,
    active: row.active as boolean,
  };
}

/* ------------------------------------------------------------------ */

export async function supaListProfiles(): Promise<Profile[]> {
  const db = getSupabase()!;
  const { data } = await db.from('profiles').select(profileSelect).order('created_at');
  return (data ?? []).map(mapProfile);
}

export async function supaGetProfileBySlug(slug: string): Promise<Profile | null> {
  const db = getSupabase()!;
  const { data } = await db.from('profiles').select(profileSelect).eq('slug', slug).maybeSingle();
  return data ? mapProfile(data) : null;
}

export async function supaGetProfileById(id: string): Promise<Profile | null> {
  const db = getSupabase()!;
  const { data } = await db.from('profiles').select(profileSelect).eq('id', id).maybeSingle();
  return data ? mapProfile(data) : null;
}

export async function supaSaveProfile(profile: Profile): Promise<Profile> {
  const db = getSupabase()!;
  const { data } = await db
    .from('profiles')
    .upsert({
      id: profile.id,
      slug: profile.slug,
      name: profile.name,
      handle: profile.handle,
      motto: profile.motto,
      bio: profile.bio,
      avatar_url: profile.avatarUrl,
      cover_url: profile.coverUrl,
      background_url: profile.backgroundUrl || null,
      partner_logo_url: profile.partnerLogoUrl || null,
      partner_name: profile.partnerName || null,
      platform: profile.platform,
      platform_label: profile.platformLabel,
      whatsapp: profile.whatsapp,
      instagram: profile.instagram,
      telegram: profile.telegram,
      games_url: profile.gamesUrl,
      support_url: profile.supportUrl,
      verified: profile.verified,
      theme: profile.theme,
      created_at: profile.createdAt,
      updated_at: profile.updatedAt,
    } as Record<string, unknown>)
    .select(profileSelect)
    .single();
  return data ? mapProfile(data) : null as unknown as Profile;
}

/* ---------- links ---------- */

export async function supaListLinks(profileId: string): Promise<ProfileLink[]> {
  const db = getSupabase()!;
  const { data } = await db.from('profile_links').select('*').eq('profile_id', profileId).order('position');
  return (data ?? []).map(mapLink);
}

export async function supaSaveLink(link: ProfileLink): Promise<ProfileLink> {
  const db = getSupabase()!;
  const { data } = await db.from('profile_links').upsert(link).select('*').single();
  return mapLink(data);
}

export async function supaDeleteLink(id: string): Promise<void> {
  const db = getSupabase()!;
  await db.from('profile_links').delete().eq('id', id);
}

/* ---------- parceiros ---------- */

function mapPartner(row: Record<string, unknown>): Partner {
  return {
    id: row.id as string,
    profileId: row.profile_id as string,
    name: (row.name as string) ?? '',
    logoUrl: (row.logo_url as string) ?? '',
    url: (row.url as string) ?? '',
    label: (row.label as string) ?? '',
    position: (row.position as number) ?? 0,
    active: (row.active as boolean) ?? true,
  };
}

export async function supaListPartners(profileId: string): Promise<Partner[]> {
  const db = getSupabase()!;
  const { data } = await db.from('partners').select('*').eq('profile_id', profileId).order('position');
  return (data ?? []).map(mapPartner);
}

export async function supaSavePartner(partner: Partner): Promise<Partner> {
  const db = getSupabase()!;
  const row = {
    id: partner.id,
    profile_id: partner.profileId,
    name: partner.name,
    logo_url: partner.logoUrl,
    url: partner.url,
    label: partner.label,
    position: partner.position,
    active: partner.active,
  };
  const { data } = await db.from('partners').upsert(row).select('*').single();
  return mapPartner(data);
}

export async function supaDeletePartner(id: string): Promise<void> {
  const db = getSupabase()!;
  await db.from('partners').delete().eq('id', id);
}

/* ---------- stories ---------- */

export async function supaListStories(profileId: string): Promise<Story[]> {
  const db = getSupabase()!;
  const { data } = await db.from('stories').select('*').eq('profile_id', profileId).order('created_at', { ascending: false });
  return (data ?? []).map(mapStory);
}

export async function supaSaveStory(story: Story): Promise<Story> {
  const db = getSupabase()!;
  const { data } = await db.from('stories').upsert(story).select('*').single();
  return mapStory(data);
}

export async function supaDeleteStory(id: string): Promise<void> {
  const db = getSupabase()!;
  await db.from('stories').delete().eq('id', id);
}

/* ---------- notice ---------- */

export async function supaGetActiveNotice(profileId: string): Promise<Notice | null> {
  const db = getSupabase()!;
  const { data } = await db
    .from('notices')
    .select('*')
    .eq('profile_id', profileId)
    .eq('active', true)
    .gte('ends_at', new Date().toISOString())
    .maybeSingle();
  return data ? mapNotice(data) : null;
}

export async function supaSaveNotice(notice: Notice): Promise<Notice> {
  const db = getSupabase()!;
  const { data } = await db.from('notices').upsert(notice).select('*').single();
  return mapNotice(data);
}

/* ---------- clicks ---------- */

export async function supaRecordClick(click: Omit<ClickEvent, 'id'>): Promise<void> {
  const db = getSupabase()!;
  await db.from('clicks').insert(click);
}

export async function supaSummarizeClicks(
  profileId: string,
  options: { days?: number } = {},
): Promise<ClickSummary> {
  const days = options.days ?? 7;
  const db = getSupabase()!;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await db
    .from('clicks')
    .select('*')
    .eq('profile_id', profileId)
    .gte('created_at', since);

  const clicks = data ?? [];
  const byTarget = new Map<string, number>();
  const byDay = new Map<string, number>();
  for (const c of clicks) {
    const t = (c as Record<string, unknown>).target as string;
    const d = (c as Record<string, unknown>).created_at as string;
    byTarget.set(t, (byTarget.get(t) ?? 0) + 1);
    byDay.set(d.slice(0, 10), (byDay.get(d.slice(0, 10)) ?? 0) + 1);
  }

  const summaryByTarget = [...byTarget.entries()]
    .map(([target, count]) => ({ target, label: target, count }))
    .sort((a, b) => b.count - a.count);

  const summaryByDay: { day: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    summaryByDay.push({ day, count: byDay.get(day) ?? 0 });
  }

  return { total: clicks.length, byTarget: summaryByTarget, byDay: summaryByDay };
}

/** Monta o bundle completo usando Supabase. */
export async function supaGetBundle(slug: string): Promise<ProfileBundle | null> {
  const profile = await supaGetProfileBySlug(slug);
  if (!profile) return null;
  const [links, partners, stories, notice] = await Promise.all([
    supaListLinks(profile.id),
    supaListPartners(profile.id),
    supaListStories(profile.id),
    supaGetActiveNotice(profile.id),
  ]);
  return {
    profile,
    links: links.filter((l) => l.active),
    partners: partners.filter((p) => p.active),
    stories: stories.filter((s) => new Date(s.expiresAt).getTime() > Date.now()),
    notice,
  };
}
