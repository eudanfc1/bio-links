import { Suspense } from 'react';
import AdminPage from '@/components/AdminPage';

const mode = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'supabase' : 'local';

export default function AdminRoute() {
  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: 'center', color: '#8b9a8d' }}>Carregando…</div>}>
      <AdminPage mode={mode} />
    </Suspense>
  );
}
