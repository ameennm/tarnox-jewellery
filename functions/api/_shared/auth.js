import { error } from './http.js';

const SESSION_COOKIE = 'tarnox_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function base64UrlEncodeString(value) {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlEncodeBytes(bytes) {
  let binary = '';
  for (const byte of new Uint8Array(bytes)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecodeString(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return atob(padded);
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return base64UrlEncodeBytes(signature);
}

function getCookie(request, name) {
  const cookieHeader = request.headers.get('cookie') || '';
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function sameValue(left, right) {
  if (!left || !right || left.length !== right.length) return false;
  let result = 0;
  for (let i = 0; i < left.length; i += 1) {
    result |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return result === 0;
}

export async function createAdminCookie(request, env) {
  if (!env.ADMIN_SESSION_SECRET) {
    throw new Error('ADMIN_SESSION_SECRET is not configured.');
  }

  const payload = base64UrlEncodeString(JSON.stringify({
    role: 'admin',
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  }));
  const signature = await sign(payload, env.ADMIN_SESSION_SECRET);
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';

  return `${SESSION_COOKIE}=${payload}.${signature}; HttpOnly${secure}; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearAdminCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`;
}

export async function isAdminRequest(request, env) {
  if (env.ADMIN_API_TOKEN) {
    const header = request.headers.get('authorization');
    if (header && sameValue(header, `Bearer ${env.ADMIN_API_TOKEN}`)) {
      return true;
    }
  }

  const token = getCookie(request, SESSION_COOKIE);
  if (!token || !env.ADMIN_SESSION_SECRET) return false;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expectedSignature = await sign(payload, env.ADMIN_SESSION_SECRET);
  if (!sameValue(signature, expectedSignature)) return false;

  try {
    const session = JSON.parse(base64UrlDecodeString(payload));
    return session.role === 'admin' && Number(session.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function requireAdmin(request, env) {
  const isAdmin = await isAdminRequest(request, env);
  if (!isAdmin) {
    return error('Admin session required', 401);
  }
  return null;
}
