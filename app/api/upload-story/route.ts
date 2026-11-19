import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 100 * 1024 * 1024; // 100 MB

const ALLOWED_TYPES: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 500 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: 'Envie multipart/form-data.' }, { status: 400 });
  }

  const file = form.get('file');
  const slug = String(form.get('slug') ?? '');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Arquivo ausente.' }, { status: 400 });
  }
  if (!slug) {
    return NextResponse.json({ error: 'Slug ausente.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Arquivo muito grande (máximo 100 MB).' }, { status: 413 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: 'Formato não suportado. Use MP4, WebM, MOV, JPG, PNG ou WebP.' },
      { status: 415 },
    );
  }

  const isVideo = file.type.startsWith('video/');
  const filename = `stories/${slug}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const supabase = createClient(supabaseUrl, supabaseAnon);

  // Garante que o bucket 'media' existe
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = (buckets ?? []).some((b: { name: string }) => b.name === 'media');
  if (!bucketExists) {
    await supabase.storage.createBucket('media', { public: true });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(filename, bytes, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from('media')
    .getPublicUrl(filename);

  return NextResponse.json({
    url: publicUrl,
    mediaType: isVideo ? 'video' : 'image',
  });
}
