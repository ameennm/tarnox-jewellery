import { error } from '../../api/_shared/http.js';

export async function onRequestGet({ env, params }) {
  if (!env.PRODUCT_IMAGES) {
    return error('Image storage is not connected yet', 503);
  }

  const object = await env.PRODUCT_IMAGES.get(params.key);
  if (!object) return error('Image not found', 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', headers.get('cache-control') || 'public, max-age=31536000, immutable');

  return new Response(object.body, { headers });
}
