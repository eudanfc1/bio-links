/**
 * Modelo de dados da plataforma.
 *
 * O mesmo formato alimenta o painel administrativo, a API e a página pública.
 * Tudo que é salvo em `theme` é um objeto livre de cores e opções visuais.
 */

export type Theme = {
  /** Cor de destaque principal (gradiente e botões). */
  accent: string;
  /**
   * Variante do destaque para surfaces escuras.
   *
   * O gate anti-bot é um cartão de vidro escuro: um destaque escuro demais
   * sumiria nele. Esta cor é usada só ali.
   */
  accentBright: string;
  /** Cor de apoio do degradê. */
  accentAlt: string;
  /** Cor do texto sobre a cor de destaque. */
  onAccent: string;
  /** Cor de fundo da página. */
  bg: string;
  /** Cor de fundo das áreas elevadas (cartões). */
  surface: string;
  /** Cor do texto principal. */
  text: string;
  /**
   * Cor do texto sobre o fundo da página (nome, marca, ícones).
   *
   * Separada de `text` porque `text` é sempre claro: os cartões são
   * escuros. Com um fundo claro, o nome precisa de uma cor escura própria.
   */
  name: string;
  /** Cor do texto secundário. */
  muted: string;
  /** Cor da borda dos cartões. */
  border: string;
  /** Links extras de plataforma (2 a 5). */
  platform2?: string | null;
  platform3?: string | null;
  platform4?: string | null;
  platform5?: string | null;
  /** Link da plataforma VIP, exibido como selo no topo. */
  vip?: string | null;
  /** Telegram aparece no grupo de botões sociais. */
  telegram?: string | null;
};

export type LinkKind = 'platform' | 'social' | 'custom';

export type ProfileLink = {
  id: string;
  profileId: string;
  label: string;
  url: string;
  kind: LinkKind;
  /** Chave do ícone SVG inline (ver `components/icons.tsx`). */
  icon: string;
  /**
   * Imagem de fundo do card em "Destinos Disponíveis".
   * Aceita caminho local (`/assets/...`) ou URL absoluta. Vazio = card escuro.
   */
  backgroundUrl?: string | null;
  /** Ordem manual na lista. Menor aparece primeiro. */
  position: number;
  active: boolean;
};

export type Story = {
  id: string;
  profileId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption: string;
  createdAt: string;
  /** Stories somem sozinhos 24h após a criação. */
  expiresAt: string;
};

export type Notice = {
  id: string;
  profileId: string;
  kicker: string;
  text: string;
  url: string;
  /** ISO 8601. Quando ausente, o aviso fica sem contagem regressiva. */
  endsAt: string | null;
  active: boolean;
};

export type Profile = {
  id: string;
  slug: string;
  name: string;
  handle: string;
  motto: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string;
  /** Imagem de fundo da página (separada da capa). */
  backgroundUrl: string;
  /** Imagem do logo do parceiro. */
  partnerLogoUrl: string;
  /** Nome do parceiro exibido na seção de parceiro. */
  partnerName: string;
  /** Rede principal, exibida em destaque no topo da lista. */
  platform: string;
  platformLabel: string;
  whatsapp: string;
  instagram: string;
  telegram: string;
  /** Link aberto ao clicar em qualquer card da grade "Nossos jogos". */
  gamesUrl: string;
  /** Link do botão "Suporte" da barra inferior (URL completa ou só o número). */
  supportUrl: string;
  verified: boolean;
  theme: Theme;
  createdAt: string;
  updatedAt: string;
};

/** Perfil + coleções, como devolvido pela API pública. */
export type ProfileBundle = {
  profile: Profile;
  links: ProfileLink[];
  partners: Partner[];
  stories: Story[];
  notice: Notice | null;
};

/** Parceiro oficial exibido na página (um ou vários). */
export type Partner = {
  id: string;
  profileId: string;
  /** Nome grande exibido abaixo de "Parceiro oficial". */
  name: string;
  logoUrl: string;
  /** Link do botão. Vazio = mostra o link da plataforma do perfil. */
  url: string;
  /** Rótulo do botão, ex.: "Jogue aqui". */
  label: string;
  position: number;
  active: boolean;
};

export type ClickEvent = {
  id: string;
  profileId: string;
  linkId: string | null;
  /** Chave do destino (`platform`, `instagram`, id do link...). */
  target: string;
  createdAt: string;
  referrer: string;
  userAgent: string;
};

/** Resumo agregado para o relatório do painel. */
export type ClickSummary = {
  total: number;
  byTarget: { target: string; label: string; count: number }[];
  byDay: { day: string; count: number }[];
};
