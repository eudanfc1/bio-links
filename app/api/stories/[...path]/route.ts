import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

import { getProfileBySlug, listStories } from '@/lib/store';

/**
 * Proxy simples de mídia de stories.
 * Em produção com Supabase, redireciona para a URL do Storage.
 * Em file store, redireciona para o caminho local.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await params;
  if (!parts || parts.length < 2) {
    return NextResponse.json({ error: 'Caminho inválido.' }, { status: 400 });
  }

  const slug = parts[0];
  const storyId = parts[1];

  // Se o story aponta para um arquivo local (ex.: /assets/story.svg), serve
  // esse arquivo. Sem isso, cai sempre no placeholder escuro.
  const profile = await getProfileBySlug(slug);
  if (profile) {
    const story = (await listStories(profile.id)).find((s) => s.id === storyId);
    const url = story?.mediaUrl ?? '';

    // Mídia hospedada fora (ex.: Supabase Storage): redireciona para a URL pública.
    if (/^https?:\/\//i.test(url)) {
      return NextResponse.redirect(url, 307);
    }
    if (url.startsWith('/') && !url.includes('..')) {
      const local = join(process.cwd(), 'public', url.replace(/^\//, ''));
      try {
        const s = await stat(local);
        const file = await readFile(local);
        const contentType = url.endsWith('.svg') ? 'image/svg+xml' : 'application/octet-stream';
        return new NextResponse(file, {
          headers: {
            'Content-Type': contentType,
            'Content-Length': String(s.size),
            'Cache-Control': 'public, max-age=300',
          },
        });
      } catch {
        /* segue para o placeholder */
      }
    }
  }

  const mediaPath = join(process.cwd(), 'public', 'assets', 'stories', slug, storyId);

  let fileSize = 0;
  let mtimeMs = 0;
  try {
    const s = await stat(mediaPath);
    fileSize = s.size;
    mtimeMs = s.mtimeMs;
  } catch {
    // Fallback: placeholder SVG.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="700" viewBox="0 0 400 700">
      <rect width="400" height="700" fill="#101410"/>
      <text x="200" y="350" text-anchor="middle" fill="#8b9a8d" font-family="sans-serif" font-size="14">Story</text>
    </svg>`;
    return new NextResponse(svg, {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' },
    });
  }

  const ext = extname(mediaPath).toLowerCase();
  const mime: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
  };
  const contentType = mime[ext] ?? 'application/octet-stream';

  const file = await readFile(mediaPath);
  return new NextResponse(file, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(fileSize),
      'Cache-Control': 'public, max-age=300',
      ETag: `"${mtimeMs}-${fileSize}"`,
    },
  });
}
