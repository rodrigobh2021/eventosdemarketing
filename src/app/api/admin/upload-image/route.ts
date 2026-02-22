import { NextResponse } from 'next/server';
import { supabaseAdmin, SUPABASE_BUCKET, SUPABASE_STORAGE_PREFIX } from '@/lib/supabase-admin';

/**
 * POST /api/admin/upload-image
 *
 * Accepts a multipart FormData with:
 *   - file: WebP Blob (already processed client-side via Canvas API)
 *   - old_url?: previous image_url to delete if it's a Supabase-hosted file
 *
 * Returns: { url: string } — the public Supabase Storage URL
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const oldUrl = (formData.get('old_url') as string | null) ?? null;

    if (!file) {
      return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 });
    }

    // Ensure bucket exists — createBucket is idempotent (error ignored if already exists)
    await supabaseAdmin.storage.createBucket(SUPABASE_BUCKET, { public: true }).catch(() => {});

    // Sanitize original filename (remove extension, slugify, truncate)
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    const sanitized =
      nameWithoutExt
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60) || 'image';

    const filename = `${Date.now()}-${sanitized}.webp`;
    const buffer = await file.arrayBuffer();

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from(SUPABASE_BUCKET)
      .upload(filename, buffer, {
        contentType: 'image/webp',
        upsert: false,
      });

    if (uploadError) {
      console.error('[upload-image] Supabase upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Delete previous Supabase-hosted image (non-blocking)
    if (oldUrl && oldUrl.startsWith(SUPABASE_STORAGE_PREFIX)) {
      const oldPath = oldUrl.slice(SUPABASE_STORAGE_PREFIX.length);
      supabaseAdmin.storage
        .from(SUPABASE_BUCKET)
        .remove([oldPath])
        .catch((err: unknown) => console.warn('[upload-image] Failed to delete old file:', err));
    }

    const publicUrl = `${SUPABASE_STORAGE_PREFIX}${filename}`;
    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error('[upload-image] error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
