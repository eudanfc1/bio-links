import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import { defaultTheme } from './theme';
import type {
  ClickEvent,
  ClickSummary,
  Notice,
  Partner,
  Profile,
  ProfileBundle,
  ProfileLink,
  Story,
} from './types';

/**
 * Store local em arquivo JSON.
 *
 * Serve de fallback quando as variáveis do Supabase não estão definidas, para
 * que o projeto rode com `npm run dev` sem nenhuma configuração. Quando o
 * Supabase está presente, `lib/store.ts` delega para `lib/store-supabase.ts`.
 */

type Database = {
  profiles: Profile[];
  links: ProfileLink[];
  partners: Partner[];
  stories: Story[];
  notices: Notice[];
  clicks: ClickEvent[];
};

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

const emptyDatabase = (): Database => ({
  profiles: [],
  links: [],
  partners: [],
  stories: [],
  notices: [],
  clicks: [],
});

/**
 * Cache em memória para não reler o arquivo a cada requisição.
 * `mtimeMs` invalida a cache quando o arquivo muda por fora.
 */
let cache: { mtimeMs: number; db: Database } | null = null;

async function readDatabase(): Promise<Database> {
  try {
    const stat = await fs.stat(DATA_FILE);
    if (cache && cache.mtimeMs === stat.mtimeMs) return cache.db;
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Database;
    const db: Database = {
      profiles: parsed.profiles ?? [],
      links: parsed.links ?? [],
      partners: parsed.partners ?? [],
      stories: parsed.stories ?? [],
      notices: parsed.notices ?? [],
      clicks: parsed.clicks ?? [],
    };
    cache = { mtimeMs: stat.mtimeMs, db };
    return db;
  } catch {
    const db = emptyDatabase();
    cache = { mtimeMs: 0, db };
    return db;
  }
}

async function writeDatabase(db: Database): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
  cache = null;
}

const nowIso = () => new Date().toISOString();

/* ------------------------------------------------------------------ */
/* Perfis                                                              */
/* ------------------------------------------------------------------ */

export async function listProfiles(): Promise<Profile[]> {
  const db = await readDatabase();
  return db.profiles;
}

export async function getProfileBySlug(slug: string): Promise<Profile | null> {
  const db = await readDatabase();
  return db.profiles.find((p) => p.slug === slug) ?? null;
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const db = await readDatabase();
  return db.profiles.find((p) => p.id === id) ?? null;
}

export async function saveProfile(profile: Profile): Promise<Profile> {
  const db = await readDatabase();
  const index = db.profiles.findIndex((p) => p.id === profile.id);
  const next = { ...profile, updatedAt: nowIso() };
  if (index >= 0) db.profiles[index] = next;
  else db.profiles.push(next);
  await writeDatabase(db);
  return next;
}

/* ------------------------------------------------------------------ */
/* Links                                                               */
/* ------------------------------------------------------------------ */

export async function listLinks(profileId: string): Promise<ProfileLink[]> {
  const db = await readDatabase();
  return db.links
    .filter((l) => l.profileId === profileId)
    .sort((a, b) => a.position - b.position);
}

export async function saveLink(link: ProfileLink): Promise<ProfileLink> {
  const db = await readDatabase();
  const index = db.links.findIndex((l) => l.id === link.id);
  if (index >= 0) db.links[index] = link;
  else db.links.push(link);
  await writeDatabase(db);
  return link;
}

export async function deleteLink(id: string): Promise<void> {
  const db = await readDatabase();
  db.links = db.links.filter((l) => l.id !== id);
  await writeDatabase(db);
}

/* ------------------------------------------------------------------ */
/* Stories                                                             */
/* ------------------------------------------------------------------ */

export async function listPartners(profileId: string): Promise<Partner[]> {
  const db = await readDatabase();
  return db.partners
    .filter((p) => p.profileId === profileId)
    .sort((a, b) => a.position - b.position);
}

export async function savePartner(partner: Partner): Promise<Partner> {
  const db = await readDatabase();
  const index = db.partners.findIndex((p) => p.id === partner.id);
  if (index >= 0) db.partners[index] = partner;
  else db.partners.push(partner);
  await writeDatabase(db);
  return partner;
}

export async function deletePartner(id: string): Promise<void> {
  const db = await readDatabase();
  db.partners = db.partners.filter((p) => p.id !== id);
  await writeDatabase(db);
}

export async function listStories(profileId: string): Promise<Story[]> {
  const db = await readDatabase();
  return db.stories
    .filter((s) => s.profileId === profileId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveStory(story: Story): Promise<Story> {
  const db = await readDatabase();
  const index = db.stories.findIndex((s) => s.id === story.id);
  if (index >= 0) db.stories[index] = story;
  else db.stories.push(story);
  await writeDatabase(db);
  return story;
}

export async function deleteStory(id: string): Promise<void> {
  const db = await readDatabase();
  db.stories = db.stories.filter((s) => s.id !== id);
  await writeDatabase(db);
}

/* ------------------------------------------------------------------ */
/* Aviso / faixa do topo                                               */
/* ------------------------------------------------------------------ */

export async function getActiveNotice(profileId: string): Promise<Notice | null> {
  const db = await readDatabase();
  const notice = db.notices.find((n) => n.profileId === profileId && n.active);
  if (!notice) return null;
  if (notice.endsAt && new Date(notice.endsAt).getTime() < Date.now()) return null;
  return notice;
}

export async function saveNotice(notice: Notice): Promise<Notice> {
  const db = await readDatabase();
  const index = db.notices.findIndex((n) => n.profileId === notice.profileId);
  if (index >= 0) db.notices[index] = notice;
  else db.notices.push(notice);
  await writeDatabase(db);
  return notice;
}

/* ------------------------------------------------------------------ */
/* Cliques                                                             */
/* ------------------------------------------------------------------ */

export async function recordClick(event: Omit<ClickEvent, 'id'>): Promise<void> {
  const db = await readDatabase();
  db.clicks.push({ ...event, id: randomUUID() });
  await writeDatabase(db);
}

export async function summarizeClicks(
  profileId: string,
  options: { days?: number; labels?: Record<string, string> } = {},
): Promise<ClickSummary> {
  const days = options.days ?? 7;
  const labels = options.labels ?? {};
  const db = await readDatabase();
  const since = Date.now() - days * 24 * 60 * 60 * 1000;

  const relevant = db.clicks.filter(
    (c) => c.profileId === profileId && new Date(c.createdAt).getTime() >= since,
  );

  const counts = new Map<string, number>();
  const perDay = new Map<string, number>();
  for (const click of relevant) {
    counts.set(click.target, (counts.get(click.target) ?? 0) + 1);
    const day = click.createdAt.slice(0, 10);
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
  }

  const byTarget = [...counts.entries()]
    .map(([target, count]) => ({ target, label: labels[target] ?? target, count }))
    .sort((a, b) => b.count - a.count);

  // Preenche dias sem clique para o gráfico não ter buracos.
  const byDay: { day: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    byDay.push({ day, count: perDay.get(day) ?? 0 });
  }

  return { total: relevant.length, byTarget, byDay };
}

/* ------------------------------------------------------------------ */
/* Seed                                                                */
/* ------------------------------------------------------------------ */

/**
 * Cria o perfil de demonstração na primeira execução.
 * Também é chamado pelo botão "restaurar dados de exemplo" do painel.
 */
export async function seedIfEmpty(): Promise<void> {
  const db = await readDatabase();
  if (db.profiles.length > 0) return;

  const now = nowIso();
  const profileId = 'demo-profile';
  const profile: Profile = {
    id: profileId,
    slug: 'levivrog',
    name: 'LEVIVROG',
    handle: '@levivrog',
    motto: 'Só quem se arrisca conta',
    bio: 'Todos os meus links em um só lugar.',
    avatarUrl:
      'https://gpcgwpjwnbeqpttwldmu.supabase.co/storage/v1/object/public/mael7-profile-media/d57ad1fc5802ecd34a1d9109c0ca609e/avatar/1e728c6e-2736-4cc6-b6b0-f2b7c5e36d53.webp',
    coverUrl:
      'https://gpcgwpjwnbeqpttwldmu.supabase.co/storage/v1/object/public/mael7-profile-media/d57ad1fc5802ecd34a1d9109c0ca609e/banner/f810f94a-aabc-4e69-9d39-4c4d2d5b556b.png',
    backgroundUrl: '',
    partnerLogoUrl: '',
    partnerName: '',
    platform: 'https://exemplo.com/plataforma',
    platformLabel: 'MINHA PLATAFORMA',
    whatsapp: 'https://wa.me/5500000000000',
    instagram: 'https://instagram.com/exemplo',
    telegram: '',
    gamesUrl: '',
    supportUrl: '',
    verified: true,
    // Paleta azul bebê: fundo claro, cartões escuros, destaque profundo
    // na página e um azul mais vivo no gate (que é um cartão escuro).
    theme: {
      ...defaultTheme,
      accent: '#0B5394',
      accentBright: '#1685da',
      accentAlt: '#0b0b0c',
      onAccent: '#ffffff',
      bg: '#89CFF0',
      surface: '#161618',
      text: '#f5f7f3',
      name: '#08304D',
      muted: '#8c9785',
      border: '#4a4a50',
    },
    createdAt: now,
    updatedAt: now,
  };

  const links: ProfileLink[] = [
    {
      id: 'link-1',
      profileId,
      label: 'Minha plataforma',
      url: profile.platform,
      kind: 'platform',
      icon: 'play',
      position: 0,
      active: true,
    },
    {
      id: 'link-2',
      profileId,
      label: 'Instagram',
      url: profile.instagram,
      kind: 'social',
      icon: 'instagram',
      position: 1,
      active: true,
    },
    {
      id: 'link-3',
      profileId,
      label: 'WhatsApp',
      url: profile.whatsapp,
      kind: 'social',
      icon: 'whatsapp',
      position: 2,
      active: true,
    },
  ];

  const story: Story = {
    id: 'story-1',
    profileId,
    mediaUrl: '/assets/story.svg',
    mediaType: 'image',
    caption: 'Bateu a meta 🔥',
    createdAt: now,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  const notice: Notice = {
    id: 'notice-1',
    profileId,
    kicker: 'AVISO',
    text: 'Bônus especial liberado por tempo limitado.',
    url: profile.platform,
    endsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
  };

  // Primeiro "parceiro oficial", montado a partir dos campos antigos do perfil.
  const partner: Partner = {
    id: 'partner-1',
    profileId,
    name: profile.partnerName || profile.name,
    logoUrl: profile.partnerLogoUrl || profile.avatarUrl,
    url: profile.platform,
    label: profile.platformLabel || 'Jogue aqui',
    position: 0,
    active: true,
  };

  db.profiles.push(profile);
  db.links.push(...links);
  db.partners.push(partner);
  db.stories.push(story);
  db.notices.push(notice);
  await writeDatabase(db);
}

/** Monta o pacote completo (perfil + links + stories + aviso) de um slug. */
export async function getBundle(slug: string): Promise<ProfileBundle | null> {
  const profile = await getProfileBySlug(slug);
  if (!profile) return null;
  const [links, partners, stories, notice] = await Promise.all([
    listLinks(profile.id),
    listPartners(profile.id),
    listStories(profile.id),
    getActiveNotice(profile.id),
  ]);
  return {
    profile,
    links: links.filter((l) => l.active),
    partners: partners.filter((p) => p.active),
    stories: stories.filter((s) => new Date(s.expiresAt).getTime() > Date.now()),
    notice,
  };
}
