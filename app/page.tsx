import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: '#080b08', color: '#eef3ee', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px' }}>
      <div style={{ maxWidth: 520 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #22c55e, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 28, fontWeight: 900, color: '#04140a' }}>B</div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 900, margin: '0 0 12px', letterSpacing: '-.02em' }}>
          Todos os seus links<br />em um só lugar.
        </h1>
        <p style={{ fontSize: 16, color: '#8b9a8d', maxWidth: 380, margin: '0 auto 32px', lineHeight: 1.6 }}>
          Crie sua página personalizada com anti-bot, stories, avisos e rastreamento de cliques. Grátis e rápido.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/admin" style={{ background: '#22c55e', color: '#04140a', padding: '12px 28px', borderRadius: 12, fontWeight: 700, fontSize: 15 }}>
            Criar minha página
          </Link>
          <Link href="/p/levivrog" style={{ background: '#101410', color: '#eef3ee', border: '1px solid #1e2a20', padding: '12px 28px', borderRadius: 12, fontWeight: 600, fontSize: 15 }}>
            Ver exemplo
          </Link>
        </div>
      </div>
    </div>
  );
}
