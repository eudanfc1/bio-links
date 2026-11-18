'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import type { Notice, Partner, Profile, ProfileLink, Story, Theme, ClickSummary } from '@/lib/types';
import { defaultTheme } from '@/lib/theme';
import { Icons } from './icons';

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
const asTheme = (raw: unknown): Theme => ({ ...defaultTheme, ...(raw as Partial<Theme> || {}) });
const hexToRgba = (hex: string, alpha: number): string => {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

function useAdmin() {
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    if (sessionStorage.getItem('admin') === '1') setAdmin(true);
  }, []);

  const login = (pwd: string) => {
    if (pwd === 'admin123') {
      sessionStorage.setItem('admin', '1');
      setAdmin(true);
      return true;
    }
    return false;
  };
  const logout = () => {
    sessionStorage.removeItem('admin');
    setAdmin(false);
  };
  return { admin, login, logout };
}

/* ------------------------------------------------------------------ */

type Tab = 'perfil' | 'links' | 'parceiros' | 'stories' | 'aviso' | 'relatorios';

const tabs: { key: Tab; label: string }[] = [
  { key: 'perfil', label: 'Perfil' },
  { key: 'links', label: 'Links' },
  { key: 'parceiros', label: 'Parceiros' },
  { key: 'stories', label: 'Stories' },
  { key: 'aviso', label: 'Aviso' },
  { key: 'relatorios', label: 'Relatórios' },
];

/** Ícones do menu lateral (traço, 24x24, seguindo o padrão do resto do app). */
const NAV_ICONS: Record<Tab, JSX.Element> = {
  perfil: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),
  links: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l1.33-1.33" />
    </svg>
  ),
  parceiros: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  stories: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
      <path d="M10.5 9.5l5 2.5-5 2.5z" />
    </svg>
  ),
  aviso: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11v2a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1z" />
      <path d="M16 8a5 5 0 0 1 0 8" />
      <path d="M19 5a9 9 0 0 1 0 14" />
    </svg>
  ),
  relatorios: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </svg>
  ),
};

export default function AdminPage({ mode }: { mode: 'local' | 'supabase' }) {
  const search = useSearchParams();
  const { admin, login, logout } = useAdmin();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<ProfileLink[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [clicks, setClicks] = useState<ClickSummary | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('perfil');
  const [toast, setToast] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  /* ---------- data load ---------- */
  const loadData = useCallback(async (slug: string) => {
    setLoading(true);
    const res = await fetch(`/api/admin?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setProfile(data.profile);
      setLinks(data.links ?? []);
      setPartners(data.partners ?? []);
      setStories(data.stories ?? []);
      setNotice(data.notice ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!admin) return;
    const slug = search.get('profile');
    if (slug) {
      setCurrentSlug(slug);
      loadData(slug);
      return;
    }
    // Sem ?profile= na URL: busca a lista de perfis e abre o primeiro.
    let cancelled = false;
    (async () => {
      const res = await fetch('/api/admin', { cache: 'no-store' });
      const data = await res.json().catch(() => ({ profiles: [] }));
      if (cancelled) return;
      const list = (data.profiles ?? []) as Profile[];
      setProfiles(list);
      if (list.length > 0) {
        setCurrentSlug(list[0].slug);
        loadData(list[0].slug);
      } else {
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [admin, search, loadData]);

  const switchProfile = (slug: string) => {
    setCurrentSlug(slug);
    loadData(slug);
  };

  /* ---------- helpers ---------- */
  const api = async (action: string, data?: unknown) => {
    const slug = profile?.slug;
    if (!slug) return null;
    const res = await fetch('/api/admin', {
      method: 'POST',
      body: JSON.stringify({ action, slug, data }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) { flash('Erro ao salvar'); return null; }
    return res.json();
  };

  /* ---------- actions ---------- */
  const updateProfile = (patch: Partial<Profile>) => {
    if (!profile) return;
    setProfile({ ...profile, ...patch, updatedAt: new Date().toISOString() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    api('updateProfile', patch).then(r => { if (r?.profile) setProfile(r.profile); });
  };

  const updateTheme = (patch: Partial<Theme>) => {
    if (!profile) return;
    const nextTheme = { ...profile.theme, ...patch } as Theme;
    updateProfile({ theme: nextTheme });
  };

  const doAddLink = async () => {
    const link = { id: uid(), profileId: profile!.id, label: 'Novo link', url: '', kind: 'custom' as const, icon: 'arrow', position: links.length, active: true };
    const r = await api('updateLinks', [...links, link]);
    if (r) setLinks([...links, link]);
    flash('Link adicionado.');
  };

  const doUpdateLink = async (link: ProfileLink) => {
    const next = links.map((l) => (l.id === link.id ? link : l));
    const r = await api('updateLinks', next);
    if (r) setLinks(next);
  };

  const doDeleteLink = async (id: string) => {
    const next = links.filter((l) => l.id !== id);
    const r = await api('updateLinks', next);
    if (r) setLinks(next);
    flash('Link removido.');
  };

  const doAddPartner = async () => {
    const partner = { id: uid(), profileId: profile!.id, name: '', logoUrl: '', url: '', label: 'Jogue aqui', position: partners.length, active: true };
    const r = await api('updatePartners', [...partners, partner]);
    if (r) setPartners([...partners, partner]);
    flash('Parceiro adicionado.');
  };

  const doUpdatePartner = async (partner: Partner) => {
    const next = partners.map((p) => (p.id === partner.id ? partner : p));
    const r = await api('updatePartners', next);
    if (r) setPartners(next);
  };

  const doDeletePartner = async (id: string) => {
    const next = partners.filter((p) => p.id !== id);
    const r = await api('updatePartners', next);
    if (r) setPartners(next);
    flash('Parceiro removido.');
  };

  const doAddStory = async () => {
    const story = { id: uid(), profileId: profile!.id, mediaUrl: '', mediaType: 'image' as const, caption: 'Novo story', createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString() };
    const next = [story, ...stories];
    const r = await api('updateStories', next);
    if (r) setStories(next);
    flash('Story adicionado.');
  };

  const doUpdateStories = async (next: Story[]) => {
    const r = await api('updateStories', next);
    if (r) setStories(next);
  };

  const doDeleteStory = async (id: string) => {
    const next = stories.filter((s) => s.id !== id);
    const r = await api('updateStories', next);
    if (r) setStories(next);
    flash('Story removido.');
  };

  const doSaveNotice = async (n: Partial<Notice>) => {
    const r = await api('updateNotice', n);
    if (r) setNotice(r.notice);
    flash('Aviso salvo.');
  };

  const doSummary = async () => {
    const res = await fetch(`/api/admin/profile/stats?slug=${profile?.slug}&days=7`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setClicks(data);
    }
  };

  useEffect(() => {
    if (tab === 'relatorios') doSummary();
  }, [tab]);

  /* ---------- login ---------- */
  if (!admin) {
    return <LoginScreen onLogin={login} />;
  }

  if (loading || !profile) {
    if (!loading && !profile) {
      return (
        <div style={{ padding: 60, textAlign: 'center', color: '#8b9a8d' }}>
          Nenhum perfil encontrado para editar.
          <br />
          <button className="btn btn-sm btn-secondary" style={{ marginTop: 16 }} onClick={logout}>Sair</button>
        </div>
      );
    }
    return <div style={{ padding: 60, textAlign: 'center', color: '#8b9a8d' }}>Carregando…</div>;
  }

  const theme = asTheme(profile.theme);
  const accent = theme.accent;
  const onAccent = theme.onAccent || '#04140a';

  return (
    <div className="shell">
      {/* O painel é sempre escuro: o tema do perfil (bg, surface, text) pertence
          à página pública e aparece só na prévia, no fim da aba Perfil. */}
      <style>{`
        body { background: #08090c; color: #eef3ee; }
        .shell { background: #08090c; color: #eef3ee; }
        .top-bar { background: rgba(8,9,12,.8); border-bottom-color: #1c1c22; }
        /* A cor de destaque do painel segue a do perfil. */
        .admin-layout { --admin-accent: ${accent}; }
        .btn-primary { background: ${accent}; color: ${onAccent}; }
        .btn-primary:hover { filter: brightness(1.1); }
      `}</style>

      <header className="top-bar">
        <div className="top-bar-inner">
          <h1>Meu painel</h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {profiles.length > 1 && (
              <select
                value={currentSlug ?? ''}
                onChange={(e) => switchProfile(e.target.value)}
                style={{
                  background: '#080b08', color: '#eef3ee', border: '1px solid #1e2a20',
                  borderRadius: 8, padding: '5px 8px', fontSize: 12,
                }}
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.slug}>@{p.slug}</option>
                ))}
              </select>
            )}
            <span style={{ fontSize: 12, color: '#8b9a8d' }}>
              {mode === 'supabase' ? 'Supabase' : 'Local'}
            </span>
            <button className="btn btn-sm btn-secondary" onClick={logout}>Sair</button>
          </div>
        </div>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <nav className="admin-nav" aria-label="Seções do painel">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`nav-item ${tab === t.key ? 'active' : ''}`}
                onClick={() => setTab(t.key)}
                aria-current={tab === t.key ? 'page' : undefined}
              >
                {NAV_ICONS[t.key]}
                {t.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="admin-main">

        {saved && <div className="toast" style={{ marginBottom: 16 }}>Salvo!</div>}
        {toast && <div className="toast">{toast}</div>}

        {/* PERFIL */}
        <section className={`section ${tab === 'perfil' ? 'active' : ''}`}>
          <div className="cards-grid">
          <div className="card">
            <div className="card-head">
              <h3>Identidade</h3>
              <p>Nome, @ e bio que aparecem no topo da página pública.</p>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Nome</label>
                <input value={profile.name} onChange={(e) => updateProfile({ name: e.target.value })} />
              </div>
              <div className="field">
                <label>Handle (subtítulo)</label>
                <input value={profile.handle} onChange={(e) => updateProfile({ handle: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Motto</label>
              <input value={profile.motto} onChange={(e) => updateProfile({ motto: e.target.value })} />
            </div>
            <div className="field">
              <label>Bio</label>
              <textarea value={profile.bio} onChange={(e) => updateProfile({ bio: e.target.value })} />
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Fotos</h3>
              <p>Avatar, capa, fundo da página e logo do parceiro. Clique ou arraste a imagem.</p>
            </div>
            <div className="field-row">
              <div className="field">
                <PhotoField
                  label="Foto de perfil"
                  kind="avatar"
                  value={profile.avatarUrl || ''}
                  slug={profile.slug}
                  onChange={(url) => updateProfile({ avatarUrl: url })}
                  hint="PNG, JPG, WEBP ou GIF. Até 6 MB."
                />
              </div>
              <div className="field">
                <PhotoField
                  label="Capa"
                  kind="cover"
                  value={profile.coverUrl || ''}
                  slug={profile.slug}
                  onChange={(url) => updateProfile({ coverUrl: url })}
                  hint="Imagem larga, ex. 1500x500."
                />
              </div>
              <div className="field">
                <PhotoField
                  label="Fundo da página"
                  kind="background"
                  value={profile.backgroundUrl || ''}
                  slug={profile.slug}
                  onChange={(url) => updateProfile({ backgroundUrl: url })}
                  hint="Imagem de fundo. Deixe vazio para usar gradiente."
                />
              </div>
              <div className="field">
                <PhotoField
                  label="Logo do parceiro"
                  kind="partner"
                  value={profile.partnerLogoUrl || ''}
                  slug={profile.slug}
                  onChange={(url) => updateProfile({ partnerLogoUrl: url })}
                  hint="Logo quadrada. Deixe vazio para usar a foto de perfil."
                />
              </div>
              <div className="field">
                <label>Nome do parceiro</label>
                <input
                  value={profile.partnerName}
                  onChange={(e) => updateProfile({ partnerName: e.target.value })}
                  placeholder={profile.name}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Redes e URLs</h3>
              <p>Links de contato, grade de jogos e botão de suporte. Aceita URL completa ou só o número.</p>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Slug (URL)</label>
                <input value={profile.slug} onChange={(e) => updateProfile({ slug: e.target.value })} />
              </div>
              <div className="field">
                <label>Plataforma (label)</label>
                <input value={profile.platformLabel} onChange={(e) => updateProfile({ platformLabel: e.target.value })} />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Link da plataforma</label>
                <input value={profile.platform} onChange={(e) => updateProfile({ platform: e.target.value })} placeholder="https://..." />
              </div>
              <div className="field">
                <label>Instagram</label>
                <input value={profile.instagram} onChange={(e) => updateProfile({ instagram: e.target.value })} />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>WhatsApp</label>
                <input value={profile.whatsapp} onChange={(e) => updateProfile({ whatsapp: e.target.value })} />
              </div>
              <div className="field">
                <label>Telegram</label>
                <input value={profile.telegram} onChange={(e) => updateProfile({ telegram: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Link do suporte (botão &quot;Suporte&quot; da barra)</label>
              <input
                value={profile.supportUrl ?? ''}
                onChange={(e) => updateProfile({ supportUrl: e.target.value })}
                placeholder="Cole a URL ou só o número: 85999286481"
              />
            </div>
            <div className="field">
              <label>Link dos jogos (grade &quot;Nossos jogos&quot;)</label>
              <input
                value={profile.gamesUrl ?? ''}
                onChange={(e) => updateProfile({ gamesUrl: e.target.value })}
                placeholder="https://... (todos os cards da grade abrem este link)"
              />
            </div>
            <div className="field" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input id="verified" type="checkbox" checked={profile.verified} onChange={(e) => updateProfile({ verified: e.target.checked })} />
              <label htmlFor="verified" style={{ display: 'inline', margin: 0 }}>Perfil verificado</label>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Cores e tema</h3>
              <p>Paleta usada na página pública. A prévia abaixo mostra o resultado na hora.</p>
            </div>
            <div className="field-row">
              {(['accent', 'accentBright', 'accentAlt', 'bg', 'surface', 'text', 'name', 'muted', 'border'] as (keyof Theme)[]).map((key) => {
                const val = theme[key] || defaultTheme[key] || '#000';
                const hex = typeof val === 'string' && val.startsWith('#') ? val : '#000';
                return (
                  <div className="field" key={key}>
                    <label style={{ textTransform: 'capitalize' }}>{key}</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="color" value={hex} onChange={(e) => updateTheme({ [key]: e.target.value })} />
                      <input value={hex} onChange={(e) => updateTheme({ [key]: e.target.value })} style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="field">
              <label>Prévia</label>
              <div style={{ padding: '16px', borderRadius: 12, background: theme.bg, border: `1px solid ${theme.border}` }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ width: 32, height: 32, borderRadius: '50%', background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#04140a', fontWeight: 800, fontSize: 14 }}>A</span>
                  <span>
                    <div style={{ fontWeight: 700, color: theme.text }}>{profile.name || 'Meu nome'}</div>
                    <div style={{ fontSize: 12, color: theme.muted }}>{profile.handle}</div>
                  </span>
                </div>
                <div style={{ height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentAlt})`, color: '#04140a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                  Botão principal
                </div>
              </div>
            </div>
          </div>
          </div>
        </section>

        {/* LINKS */}
        <section className={`section ${tab === 'links' ? 'active' : ''}`}>
          <div className="card">
            <div className="card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div>
                <h3>Links da página</h3>
                <p>Cada linha é um card de &quot;Destinos Disponíveis&quot;. A ordem menor aparece primeiro.</p>
              </div>
              <button className="btn btn-sm btn-primary" onClick={doAddLink}>+ Adicionar</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
            <table className="link-table">
              <thead>
                <tr>
                  <th>Ordem</th>
                  <th>Rótulo</th>
                  <th>URL</th>
                  <th>Tipo</th>
                  <th>Ícone</th>
                  <th>Fundo</th>
                  <th>Ativo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {links.sort((a,b) => a.position - b.position).map((link) => (
                  <tr key={link.id}>
                    <td>
                      <input type="number" value={link.position} min={0} style={{ width: 48 }}
                        onChange={(e) => doUpdateLink({ ...link, position: parseInt(e.target.value) || 0 })} />
                    </td>
                    <td><input value={link.label} onChange={(e) => doUpdateLink({ ...link, label: e.target.value })} style={{ width: 160 }} /></td>
                    <td><input value={link.url} onChange={(e) => doUpdateLink({ ...link, url: e.target.value })} style={{ width: 260, fontFamily: 'ui-monospace, monospace' }} /></td>
                    <td>
                      <select value={link.kind} onChange={(e) => doUpdateLink({ ...link, kind: e.target.value as ProfileLink['kind'] })}>
                        <option value="platform">Plataforma</option>
                        <option value="social">Social</option>
                        <option value="custom">Custom</option>
                      </select>
                    </td>
                    <td>
                      <select value={link.icon} onChange={(e) => doUpdateLink({ ...link, icon: e.target.value })}>
                        {!['arrow','play','instagram','whatsapp','telegram'].includes(link.icon) && (
                          <option value={link.icon}>imagem / URL</option>
                        )}
                        {['arrow','play','instagram','whatsapp','telegram'].map((ic) => (
                          <option key={ic} value={ic}>{ic}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <LinkBannerField
                        slug={profile?.slug ?? ''}
                        linkId={link.id}
                        value={link.backgroundUrl || ''}
                        onChange={(url) => doUpdateLink({ ...link, backgroundUrl: url || null })}
                      />
                    </td>
                    <td>
                      <input type="checkbox" checked={link.active} onChange={(e) => doUpdateLink({ ...link, active: e.target.checked })} />
                    </td>
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => doDeleteLink(link.id)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {links.length === 0 && <p style={{ color: '#8b9a8d', fontSize: 13, padding: '12px 0' }}>Nenhum link. Clique em "Adicionar".</p>}
            </div>
          </div>
        </section>

        {/* PARCEIROS */}
        <section className={`section ${tab === 'parceiros' ? 'active' : ''}`}>
          <div className="card">
            <div className="card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div>
                <h3>Parceiros oficiais</h3>
                <p>Exibidos na seção de parceiro da página pública. Cada parceiro tem logo, nome, botão e link próprio.</p>
              </div>
              <button className="btn btn-sm btn-primary" onClick={doAddPartner}>+ Adicionar</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
            <table className="link-table">
              <thead>
                <tr>
                  <th>Ordem</th>
                  <th>Nome</th>
                  <th>Logo URL</th>
                  <th>URL</th>
                  <th>Rótulo do botão</th>
                  <th>Ativo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {partners.sort((a,b) => a.position - b.position).map((partner) => (
                  <tr key={partner.id}>
                    <td>
                      <input type="number" value={partner.position} min={0} style={{ width: 48 }}
                        onChange={(e) => doUpdatePartner({ ...partner, position: parseInt(e.target.value) || 0 })} />
                    </td>
                    <td><input value={partner.name} onChange={(e) => doUpdatePartner({ ...partner, name: e.target.value })} style={{ width: 160 }} /></td>
                    <td><input value={partner.logoUrl} onChange={(e) => doUpdatePartner({ ...partner, logoUrl: e.target.value })} style={{ width: 260, fontFamily: 'ui-monospace, monospace' }} /></td>
                    <td><input value={partner.url} onChange={(e) => doUpdatePartner({ ...partner, url: e.target.value })} style={{ width: 260, fontFamily: 'ui-monospace, monospace' }} /></td>
                    <td><input value={partner.label} onChange={(e) => doUpdatePartner({ ...partner, label: e.target.value })} style={{ width: 140 }} /></td>
                    <td>
                      <input type="checkbox" checked={partner.active} onChange={(e) => doUpdatePartner({ ...partner, active: e.target.checked })} />
                    </td>
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => doDeletePartner(partner.id)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {partners.length === 0 && <p style={{ color: '#8b9a8d', fontSize: 13, padding: '12px 0' }}>Nenhum parceiro. Clique em "Adicionar".</p>}
            </div>
          </div>
        </section>

        {/* STORIES */}
        <section className={`section ${tab === 'stories' ? 'active' : ''}`}>
          <div className="card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div>
              <h3>Stories (duram 24h)</h3>
              <p>Somem sozinhos 24 horas depois de criados. A foto de perfil usa o anel de story enquanto houver um ativo.</p>
            </div>
            <button className="btn btn-sm btn-primary" onClick={doAddStory}>+ Adicionar</button>
          </div>
          {stories.length === 0 && <p style={{ color: '#8b9a8d', fontSize: 13 }}>Nenhum story.</p>}
          <div className="story-grid">
            {stories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                stories={stories}
                onChange={(next) => { setStories(next); doUpdateStories(next); }}
                onDelete={doDeleteStory}
              />
            ))}
          </div>
        </section>

        {/* AVISO */}
        <section className={`section ${tab === 'aviso' ? 'active' : ''}`}>
          <div className="card">
            <div className="card-head">
              <h3>Faixa de aviso do topo</h3>
              <p>Aviso com contagem regressiva exibido acima do perfil.</p>
            </div>
            <div className="notice-preview" style={{ marginBottom: 18 }}>
              <span className="kicker">{(notice?.kicker || 'AVISO').toUpperCase()}</span>
              <span style={{ flex: 1 }}>{notice?.text || 'Seu aviso aqui…'}</span>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Chip / kicker</label>
                <input value={notice?.kicker || 'AVISO'} onChange={(e) => doSaveNotice({ ...(notice ?? { id: uid(), text: '', url: '#', endsAt: null, active: true }), kicker: e.target.value })} />
              </div>
              <div className="field">
                <label>Término (ISO 8601 ou vazio)</label>
                <input value={notice?.endsAt || ''} onChange={(e) => doSaveNotice({ ...(notice!), endsAt: e.target.value || null })} />
              </div>
            </div>
            <div className="field">
              <label>Mensagem</label>
              <input value={notice?.text || ''} onChange={(e) => doSaveNotice({ ...(notice ?? { id: uid(), text: '', url: '#', endsAt: null, active: true }), text: e.target.value })} />
            </div>
            <div className="field">
              <label>URL de destino</label>
              <input value={notice?.url || ''} onChange={(e) => doSaveNotice({ ...(notice!), url: e.target.value })} />
            </div>
            <div className="field" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input id="notice-active" type="checkbox" checked={notice?.active ?? true} onChange={(e) => doSaveNotice({ ...(notice ?? { id: uid(), text: '', url: '#', endsAt: null, active: true }), active: e.target.checked })} />
              <label htmlFor="notice-active" style={{ display: 'inline', margin: 0 }}>Aviso ativo</label>
            </div>
          </div>
        </section>

        {/* RELATÓRIOS */}
        <section className={`section ${tab === 'relatorios' ? 'active' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Cliques — últimos 7 dias</h3>
            <button className="btn btn-sm btn-secondary" onClick={doSummary}>Atualizar</button>
          </div>
          {!clicks ? (
            <p style={{ color: '#8b9a8d', fontSize: 13 }}>Clique em "Atualizar" para carregar.</p>
          ) : (
            <>
              <div className="stat-grid" style={{ marginBottom: 18 }}>
                <div className="stat-card">
                  <div className="stat-value">{clicks.total}</div>
                  <div className="stat-label">Total de cliques</div>
                </div>
                {clicks.byTarget.slice(0, 3).map((t) => (
                  <div className="stat-card" key={t.target}>
                    <div className="stat-value">{t.count}</div>
                    <div className="stat-label">{t.label}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <h3>Por destino</h3>
                <table className="link-table">
                  <thead><tr><th>Destino</th><th>Cliques</th></tr></thead>
                  <tbody>
                    {clicks.byTarget.map((t) => (
                      <tr key={t.target}>
                        <td>{t.label}</td>
                        <td style={{ fontWeight: 700 }}>{t.count}</td>
                      </tr>
                    ))}
                    {clicks.byTarget.length === 0 && <tr><td colSpan={2} style={{ color: '#8b9a8d' }}>Nenhum clique ainda.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="card">
                <h3>Por dia</h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {clicks.byDay.map((d) => {
                    const max = Math.max(...clicks.byDay.map((x) => x.count), 1);
                    const h = Math.max((d.count / max) * 80, 4);
                    return (
                      <div key={d.day} style={{ textAlign: 'center', minWidth: 48 }}>
                        <div style={{ height: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                          <div style={{ width: 20, height: `${h}px`, background: accent, borderRadius: '5px 5px 0 0', opacity: .85 }} />
                        </div>
                        <div style={{ fontSize: 10, color: '#8b9a8d', marginTop: 4 }}>{d.day.slice(5)}</div>
                        <div style={{ fontSize: 11, fontWeight: 700 }}>{d.count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </section>
        </main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cartão de story                                                     */
/* ------------------------------------------------------------------ */

/**
 * Precisa ser um componente próprio: o `useState` de "editando" ficava
 * dentro do `stories.map()` do AdminPage, o que mudava a quantidade de
 * hooks entre o estado de login e o painel aberto e derrubava a árvore
 * do React ("change in the order of Hooks").
 */
function StoryCard({
  story, stories, onChange, onDelete,
}: {
  story: Story;
  stories: Story[];
  onChange: (next: Story[]) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  const patch = (p: Partial<Story>) => {
    onChange(stories.map((s) => (s.id === story.id ? { ...s, ...p } : s)));
  };

  if (!editing) {
    return (
      <div className="story-card">
        {story.mediaType === 'video'
          ? <video src={story.mediaUrl} preload="metadata" />
          : <img src={story.mediaUrl} alt={story.caption} />}
        <div className="info">{story.caption || 'Sem legenda'}</div>
        <div style={{ display: 'flex', gap: 6, padding: '0 10px 10px' }}>
          <button className="btn btn-sm btn-secondary" onClick={() => setEditing(true)}>Editar</button>
          <button className="btn btn-sm btn-danger" onClick={() => onDelete(story.id)}>Excluir</button>
        </div>
      </div>
    );
  }

  return (
    <div className="story-card" style={{ gridColumn: '1 / -1' }}>
      <div className="card" style={{ margin: 0 }}>
        <div className="field-row">
          <div className="field">
            <label>URL da mídia</label>
            <input value={story.mediaUrl} onChange={(e) => patch({ mediaUrl: e.target.value })} placeholder="https://..." />
          </div>
          <div className="field">
            <label>Tipo</label>
            <select value={story.mediaType} onChange={(e) => patch({ mediaType: e.target.value as 'image' | 'video' })}>
              <option value="image">Imagem</option>
              <option value="video">Vídeo</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Legenda</label>
          <input value={story.caption} onChange={(e) => patch({ caption: e.target.value })} />
        </div>
        <button className="btn btn-sm btn-primary" onClick={() => setEditing(false)}>Concluído</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Banner de um card de destino                                        */
/* ------------------------------------------------------------------ */

/**
 * Imagem de fundo de um card em "Destinos Disponíveis". Versão compacta do
 * PhotoField para caber na linha da tabela de links. O upload usa o tipo
 * `link-bg:<id>`, então cada link tem seu próprio arquivo no servidor.
 */
function LinkBannerField({
  slug, linkId, value, onChange,
}: {
  slug: string;
  linkId: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Não salva a cada tecla: só ao sair do campo (ou Enter), igual ao PhotoField.
  useEffect(() => { setUrlDraft(value); }, [value]);

  const commitUrl = () => {
    const trimmed = urlDraft.trim();
    if (trimmed !== value) onChange(trimmed);
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErr('Escolha um arquivo de imagem.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('slug', slug);
      fd.append('kind', `link-bg:${linkId}`);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error ?? 'Não foi possível enviar a imagem.');
        return;
      }
      onChange(data.url);
    } catch {
      setErr('Falha de rede ao enviar a imagem.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        title={value ? 'Trocar banner' : 'Enviar banner'}
        style={{
          width: 96, height: 48, flexShrink: 0, padding: 0,
          borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
          border: '1px dashed #1e2a20', background: '#080b08',
          display: 'grid', placeItems: 'center',
        }}
      >
        {value
          ? <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 10, color: '#5a615c' }}>{busy ? 'enviando…' : 'sem banner'}</span>}
      </button>

      <div style={{ display: 'grid', gap: 4 }}>
        <input
          placeholder="URL do banner"
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          onBlur={commitUrl}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitUrl(); } }}
          style={{ width: 150, fontFamily: 'ui-monospace, monospace', fontSize: 11 }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" className="btn btn-sm" onClick={() => inputRef.current?.click()}>
            {busy ? 'Enviando…' : 'Enviar'}
          </button>
          {value && (
            <button type="button" className="btn btn-sm btn-danger" onClick={() => onChange('')}>
              Limpar
            </button>
          )}
        </div>
        {err && <span style={{ fontSize: 10, color: '#ef4444' }}>{err}</span>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        hidden
        onChange={(e) => upload(e.target.files?.[0])}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Campo de foto (avatar / capa)                                       */
/* ------------------------------------------------------------------ */

/**
 * Upload da foto de perfil ou da capa. Aceita arrastar-soltar, escolher
 * arquivo ou colar uma URL. O upload vai para POST /api/upload, que grava
 * em public/assets/profile/<slug>/ e devolve a URL já com cache-buster.
 */
function PhotoField({
  label, kind, value, slug, onChange, hint,
}: {
  label: string;
  kind: 'avatar' | 'cover' | 'background' | 'partner';
  value: string;
  slug: string;
  onChange: (url: string) => void;
  hint: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [urlDraft, setUrlDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setUrlDraft(value); }, [value]);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErr('Escolha um arquivo de imagem.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('slug', slug);
      fd.append('kind', kind);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error ?? 'Não foi possível enviar a imagem.');
        return;
      }
      onChange(data.url);
    } catch {
      setErr('Falha de rede ao enviar a imagem.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const commitUrl = () => {
    const trimmed = urlDraft.trim();
    if (trimmed !== value) onChange(trimmed);
  };

  const thumb = kind === 'avatar' || kind === 'partner'
    ? { width: 72, height: 72, borderRadius: '50%' }
    : { width: 120, height: 60, borderRadius: 8 };

  return (
    <div className="field">
      <label>{label}</label>

      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files?.[0]); }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `1px dashed ${over ? '#89CFF0' : '#1e2a20'}`,
          background: over ? 'rgba(22,133,218,.08)' : '#080b08',
          borderRadius: 12, padding: 14, cursor: 'pointer',
          display: 'flex', gap: 14, alignItems: 'center',
        }}
      >
        <div style={{
          ...thumb, overflow: 'hidden', background: '#141418', flexShrink: 0,
          border: '1px solid #1e2a20', display: 'grid', placeItems: 'center',
        }}>
          {value
            ? <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 11, color: '#5a615c' }}>{kind === 'avatar' ? 'sem foto' : kind === 'cover' ? 'sem capa' : kind === 'background' ? 'sem fundo' : 'sem logo'}</span>}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>
            {busy ? 'Enviando…' : 'Clique ou arraste uma imagem'}
          </div>
          <div style={{ fontSize: 12, color: '#8b9a8d', marginTop: 4 }}>{hint}</div>
          {err && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{err}</div>}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        hidden
        onChange={(e) => upload(e.target.files?.[0])}
      />

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input
          placeholder="ou cole a URL da imagem"
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          onBlur={commitUrl}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitUrl(); } }}
        />
        {value && (
          <button
            className="btn btn-sm btn-danger"
            onClick={() => { setUrlDraft(''); onChange(''); }}
          >
            Remover
          </button>
        )}
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: (pwd: string) => boolean }) {
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onLogin(pwd)) { setErr(true); setPwd(''); }
  };

  return (
    <div className="shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <form className="login-box" onSubmit={submit}>
        <h2>Painel administrativo</h2>
        <p>Entre com a senha para gerenciar sua página.</p>
        <div className="field">
          <input type="password" placeholder="Senha" value={pwd} onChange={(e) => { setPwd(e.target.value); setErr(false); }} autoFocus />
        </div>
        {err && <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 10px' }}>Senha incorreta. (Dica: admin123)</p>}
        <button className="btn btn-primary" style={{ width: '100%' }} type="submit">Entrar</button>
      </form>
    </div>
  );
}
