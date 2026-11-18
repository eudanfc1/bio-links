import ProfilePage from '@/components/ProfilePage';

type Props = { params: Promise<{ slug: string }> };

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateStaticParams() {
  // Permite que o Next gere páginas estáticas para os slugs mais comuns.
  return [{ slug: 'levivrog' }, { slug: 'demo' }];
}

export default async function PublicProfile({ params }: Props) {
  const { slug } = await params;
  const { getBundle, ensureSeed } = await import('@/lib/store');

  // Garante seed (apenas para file store).
  await ensureSeed();

  const bundle = await getBundle(slug);
  if (!bundle) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b9a8d' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', margin: '0 0 8px', color: '#eef3ee' }}>Página não encontrada</h1>
          <p>Verifique o link e tente novamente.</p>
        </div>
      </div>
    );
  }

  return <ProfilePage bundle={bundle} slug={slug} />;
}
