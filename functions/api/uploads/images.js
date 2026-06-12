import { requireAdmin } from '../_shared/auth.js';
import { error, json } from '../_shared/http.js';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/bmp']);
const maxUploadBytes = 8 * 1024 * 1024;

const extensionForType = (type) => ({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/bmp': 'bmp'
}[type] || 'bin');

const typeForExtension = (name) => {
  const extension = String(name || '').toLowerCase().split('.').pop();
  return {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    avif: 'image/avif',
    bmp: 'image/bmp'
  }[extension] || '';
};

const safeFolder = (value) => {
  const folder = String(value || 'products').toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return folder === 'categories' ? 'categories' : 'products';
};

export async function onRequestPost({ request, env }) {
  const authError = await requireAdmin(request, env);
  if (authError) return authError;

  if (!env.PRODUCT_IMAGES) {
    return error('Image storage is not connected yet. Enable Cloudflare R2 and bind PRODUCT_IMAGES.', 503);
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || typeof file.arrayBuffer !== 'function') return error('Choose an image file to upload');
  const contentType = allowedTypes.has(file.type) ? file.type : typeForExtension(file.name);
  if (!allowedTypes.has(contentType)) return error('Upload a JPG, JPEG, PNG, WEBP, GIF, AVIF, or BMP image');
  if (file.size > maxUploadBytes) return error('Image must be 8 MB or smaller');

  const folder = safeFolder(formData.get('folder'));
  const id = crypto.randomUUID();
  const key = `${folder}-${id}.${extensionForType(contentType)}`;

  await env.PRODUCT_IMAGES.put(key, await file.arrayBuffer(), {
    httpMetadata: {
      contentType,
      cacheControl: 'public, max-age=31536000, immutable'
    },
    customMetadata: {
      originalName: file.name || key,
      uploadedFrom: 'admin'
    }
  });

  return json({
    key,
    url: `/cdn/images/${key}`,
    content_type: contentType,
    size: file.size
  }, 201);
}
