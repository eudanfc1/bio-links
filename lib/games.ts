/**
 * Grade de jogos ("Nossos jogos").
 *
 * A lista vive aqui, no código — ainda sem painel administrativo. Para trocar
 * um jogo, basta editar `JOGOS`. As imagens ficam em `public/images/jogos/`;
 * enquanto o caminho não existir, o card mostra um placeholder com a inicial
 * do nome, para a página nunca exibir imagem quebrada.
 */

export type Jogo = {
  id: string;
  name: string;
  /** Ex.: `/images/jogos/fortuna-rabbit.jpg`. Vazio = placeholder. */
  img?: string;
  /** Link aberto ao clicar. Vazio = card sem ação. */
  href?: string;
};

export const JOGOS: Jogo[] = [
  { id: 'fortuna-rabbit', name: 'Fortuna Rabbit', img: '/images/jogos/fortuna-rabbit.jpg' },
  { id: 'fortuna-tiger', name: 'Fortuna Tiger', img: '/images/jogos/fortuna-tiger.jpg' },
  { id: 'fortuna-ox', name: 'Fortuna Ox', img: '/images/jogos/fortuna-ox.jpg' },
  { id: 'fortuna-mouse', name: 'Fortuna Mouse', img: '/images/jogos/fortuna-mouse.jpg' },
  { id: 'dragon-hatch', name: 'Dragon Hatch', img: '/images/jogos/dragon-hatch.jpg' },
  { id: 'ganesha-gold', name: 'Ganesha Gold', img: '/images/jogos/ganesha-gold.jpg' },
  { id: 'double-fortune', name: 'Double Fortune', img: '/images/jogos/double-fortune.jpg' },
  { id: 'dragon-tiger-luck', name: 'Dragon Tiger Luck', img: '/images/jogos/dragon-tiger-luck.jpg' },
  { id: 'snoilin-soccer', name: 'Snoilin Soccer', img: '/images/jogos/snoilin-soccer.jpg' },
];

/** As porcentagens trocam de valor a cada 10 minutos. */
export const JANELA_MS = 10 * 60 * 1000;

/**
 * Porcentagem estável do jogo dentro da janela atual de 10 minutos.
 *
 * É determinística de propósito: todo mundo que abre a página na mesma janela
 * vê o mesmo número, e o valor não muda entre o HTML do servidor e a
 * hidratação do navegador (o que causaria erro de hidratação no React).
 */
export function porcentagemDoJogo(id: string, agora: number = Date.now()): number {
  const janela = Math.floor(agora / JANELA_MS);
  let hash = 2166136261 ^ janela;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return 10 + (Math.abs(hash) % 89); // 10% a 98%
}

/** Verde acima de 70, amarelo no meio, vermelho abaixo. */
export function corDaPorcentagem(valor: number): string {
  if (valor >= 70) return '#22c55e';
  if (valor >= 40) return '#f59e0b';
  return '#ef4444';
}

/** Matiz estável por jogo, para o placeholder ficar colorido sem repetir. */
export function matizDoJogo(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) % 360;
  return hash;
}
