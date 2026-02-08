import { createHmac, timingSafeEqual } from 'crypto';

const base64ToBase64url = (base64) =>
  base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

const base64urlToBase64 = (base64url) => {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const remainder = base64.length % 4;

  if (remainder === 0) return base64;
  if (remainder === 2) return `${base64}==`;
  if (remainder === 3) return `${base64}=`;

  return null;
};

const base64urlEncode = (input) =>
  base64ToBase64url(Buffer.from(input).toString('base64'));

const base64urlEncodeBuffer = (buffer) =>
  base64ToBase64url(Buffer.from(buffer).toString('base64'));

const base64urlDecodeToBuffer = (input) => {
  const base64 = base64urlToBase64(input);
  if (!base64) throw new Error('Invalid base64url value');
  return Buffer.from(base64, 'base64');
};

const base64urlDecodeToString = (input) =>
  base64urlDecodeToBuffer(input).toString('utf8');

export const signJwt = (payload, secret, { expiresInSeconds } = {}) => {
  const header = { alg: 'HS256', typ: 'JWT' };

  const issuedAt = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: issuedAt };
  if (typeof expiresInSeconds === 'number') {
    body.exp = issuedAt + expiresInSeconds;
  }

  const headerPart = base64urlEncode(JSON.stringify(header));
  const payloadPart = base64urlEncode(JSON.stringify(body));
  const data = `${headerPart}.${payloadPart}`;

  const signature = createHmac('sha256', secret).update(data).digest();
  const signaturePart = base64urlEncodeBuffer(signature);

  return `${data}.${signaturePart}`;
};

export const verifyJwt = (token, secret) => {
  if (typeof token !== 'string') throw new Error('Token must be a string');

  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT structure');

  const [headerPart, payloadPart, signaturePart] = parts;

  let header;
  try {
    header = JSON.parse(base64urlDecodeToString(headerPart));
  } catch {
    throw new Error('Invalid JWT header');
  }

  if (header?.alg !== 'HS256' || header?.typ !== 'JWT') {
    throw new Error('Unsupported JWT');
  }

  const data = `${headerPart}.${payloadPart}`;
  const expectedSignature = createHmac('sha256', secret).update(data).digest();

  let actualSignature;
  try {
    actualSignature = base64urlDecodeToBuffer(signaturePart);
  } catch {
    throw new Error('Invalid JWT signature');
  }

  if (
    actualSignature.length !== expectedSignature.length ||
    !timingSafeEqual(actualSignature, expectedSignature)
  ) {
    throw new Error('Invalid JWT signature');
  }

  let payload;
  try {
    payload = JSON.parse(base64urlDecodeToString(payloadPart));
  } catch {
    throw new Error('Invalid JWT payload');
  }

  if (!payload || typeof payload.exp !== 'number') {
    throw new Error('JWT expiration (exp) is required');
  }

  const now = Math.floor(Date.now() / 1000);
  if (now >= payload.exp) {
    throw new Error('JWT expired');
  }

  return payload;
};

