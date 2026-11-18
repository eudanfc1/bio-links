import { NextResponse } from 'next/server';
import { mkdir, writeFile, readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

/**
 * Upload da foto de perfil / capa.
 *
 * Com SUPABASE_SERVICE_ROLE_KEY configurada (ex.: na Vercel, onde o disco é
 * somente leitura) a imagem vai para o bucket público `bio-links` do Supabase
 * Storage. Sem ela, cai no modo local abaixo.
 *
 * Em modo local (file store) grava em `public/assets/profile/<slug>/`, que
 * é servido estaticamente pelo Next. O nome do arquivo é estável
 * (`avatar.png`, `cover.jpg`), então subir uma imagem nova substitui a
 * anterior; a querystring `?v=` no retorno quebra o cache do navegador.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MAX_BYTES = 6 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
};

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: 'Envie multipart/form-data.' }, { status: 400 });
  }

  const file = form.get('file');
  const slug = String(form.get('slug') ?? '');
  const kind = String(form.get('kind') ?? '');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Arquivo ausente.' }, { status: 400 });
  }
  if (!/^[a-z0-9_-]+$/i.test(slug)) {
    return NextResponse.json({ error: 'Slug inválido.' }, { status: 400 });
  }
  // Tipos fixos do perfil + tipos por link ("link-bg:<id>", "link-icon:<id>"),
  // que permitem trocar o banner/ícone de cada card pelo painel.
  const KINDS_FIXOS = ['avatar', 'cover', 'background', 'partner'];
  let base: string;
  if (KINDS_FIXOS.includes(kind)) {
    base = kind;
  } else {
    const porLink = kind.match(/^(link-bg|link-icon):([a-z0-9_-]+)$/i);
    if (!porLink) {
      return NextResponse.json(
        { error: 'Tipo inválido (use "avatar", "cover", "background", "partner" ou "link-bg:<id>").' },
        { status: 400 },
      );
    }
    base = `${porLink[1]}-${porLink[2]}`;
  }

  const ext = EXT_BY_MIME[file.type];
  if (!ext) {
    return NextResponse.json({ error: 'Formato não suportado. Use PNG, JPG, WEBP, GIF ou AVIF.' }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Imagem muito grande (máximo 6 MB).' }, { status: 413 });
  }

  // ---- Supabase Storage (Vercel) ----------------------------------------
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supaUrl && serviceKey) {
    const supa = createClient(supaUrl, serviceKey, { auth: { persistSession: false } });
    const bucket = 'bio-links';
    const path = `${slug}/${base}${ext}`;
    const body = Buffer.from(await file.arrayBuffer());

    const { error } = await supa.storage.from(bucket).upload(path, body, {
      contentType: file.type,
      upsert: true,
      cacheControl: '3600',
    });
    if (error) {
      return NextResponse.json({ error: `Falha no upload (Supabase): ${error.message}` }, { status: 500 });
    }

    // Remove a versão anterior com outra extensão (avatar.png -> avatar.jpg).
    const { data: existentes } = await supa.storage.from(bucket).list(slug);
    const antigos = (existentes ?? [])
      .filter((f) => f.name.startsWith(`${base}.`) && f.name !== `${base}${ext}`)
      .map((f) => `${slug}/${f.name}`);
    if (antigos.length) await supa.storage.from(bucket).remove(antigos);

    const { data: pub } = supa.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({ url: `${pub.publicUrl}?v=${Date.now()}`, bytes: body.byteLength });
  }

  // ---- Disco local (cPanel / desenvolvimento) ------------------------------
  const dir = join(process.cwd(), 'public', 'assets', 'profile', slug);
  const filename = `${base}${ext}`;

  try {
    await mkdir(dir, { recursive: true });
  } catch {
    return NextResponse.json(
      { error: 'Não foi possível gravar a imagem neste ambiente (sistema de arquivos somente leitura). Use o campo de URL.' },
      { status: 500 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  try {
    await writeFile(join(dir, filename), bytes);
  } catch {
    return NextResponse.json(
      { error: 'Não foi possível gravar a imagem neste ambiente (sistema de arquivos somente leitura). Use o campo de URL.' },
      { status: 500 },
    );
  }

  // Apaga a versão anterior com outra extensão (avatar.png -> avatar.jpg).
  const antes = await readdir(dir).catch(() => [] as string[]);
  await Promise.all(
    antes
      .filter((f) => f.startsWith(`${base}.`) && f !== filename)
      .map((f) => unlink(join(dir, f)).catch(() => undefined)),
  );

  return NextResponse.json({
    url: `/assets/profile/${slug}/${filename}?v=${Date.now()}`,
    bytes: bytes.byteLength,
  });
}
