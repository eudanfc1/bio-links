/**
 * Script SQL para criar as tabelas no Supabase.
 *
 * Execute em: SQL Editor → New Query no painel do Supabase.
 */

export const sql = `
-- ============================================================
-- Tabela principal: perfis públicos
-- ============================================================
create table if not exists public.profiles (
  id            text primary key,
  slug          text unique not null,
  name          text not null,
  handle        text not null,
  motto         text default '',
  bio           text default '',
  avatar_url    text default '',
  cover_url     text default '',
  platform      text default '',
  platform_label text default 'MINHA PLATAFORMA',
  whatsapp      text default '',
  instagram     text default '',
  telegram      text default '',
  games_url     text default '',
  support_url   text default '',
  verified      boolean default false,
  theme         jsonb default '{}'::jsonb,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

-- ============================================================
-- Links de cada perfil
-- ============================================================
create table if not exists public.profile_links (
  id          text primary key,
  profile_id  text references public.profiles(id) on delete cascade not null,
  label       text not null,
  url         text not null,
  kind        text not null,
  icon        text not null,
  background_url text,
  position    int not null,
  active      boolean default true not null
);

-- ============================================================
-- Parceiros oficiais (um ou vários por perfil)
-- ============================================================
create table if not exists public.partners (
  id          text primary key,
  profile_id  text references public.profiles(id) on delete cascade not null,
  name        text not null default '',
  logo_url    text not null default '',
  url         text not null default '',
  label       text not null default '',
  position    int not null default 0,
  active      boolean default true not null
);

-- ============================================================
-- Stories (somem sozinhos 24h)
-- ============================================================
create table if not exists public.stories (
  id          text primary key,
  profile_id  text references public.profiles(id) on delete cascade not null,
  media_url   text not null,
  media_type  text not null,
  caption     text default '',
  created_at  timestamptz default now() not null,
  expires_at  timestamptz default (now() + interval '24 hours') not null
);

-- ============================================================
-- Aviso / faixa do topo
-- ============================================================
create table if not exists public.notices (
  id          text primary key,
  profile_id  text references public.profiles(id) on delete cascade not null,
  kicker      text default 'AVISO',
  text        text not null,
  url         text not null,
  ends_at     timestamptz,
  active      boolean default true not null
);

-- ============================================================
-- Cliques (rastreamento)
-- ============================================================
create table if not exists public.clicks (
  id          text primary key,
  profile_id  text references public.profiles(id) on delete cascade not null,
  link_id     text,
  target      text not null,
  created_at  timestamptz default now() not null,
  referrer    text default '',
  user_agent  text default ''
);

-- Índices para performance
create index if not exists idx_profile_slug on public.profiles (slug);
create index if not exists idx_links_profile on public.profile_links (profile_id);
create index if not exists idx_stories_profile on public.stories (profile_id, expires_at);
create index if not exists idx_clicks_profile on public.clicks (profile_id, created_at desc);
create index if not exists idx_notices_profile on public.notices (profile_id, active);
`;
