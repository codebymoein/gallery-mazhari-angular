import { Injectable } from '@nestjs/common';
import { createHash, createHmac } from 'crypto';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

export type MediaVisibility = 'public' | 'private';
export type MediaStorageDriver = 'local' | 's3';

export interface StoredMediaObject {
  key: string;
  url: string;
  localPath: string | null;
  visibility: MediaVisibility;
}

interface PutMediaObjectInput {
  buffer: Buffer;
  contentHash: string;
  extension: string;
  contentType: string;
  visibility: MediaVisibility;
  uploadsBaseUrl?: string;
}

interface S3Config {
  endpoint: URL;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
}

@Injectable()
export class MediaStorageService {
  readonly driver: MediaStorageDriver = resolveDriver();

  async put(input: PutMediaObjectInput): Promise<StoredMediaObject> {
    const key = buildContentAddressedMediaKey(
      input.contentHash,
      input.extension,
      input.visibility,
    );

    if (this.driver === 's3') {
      const config = readS3Config();
      await putS3Object(
        config,
        key,
        input.buffer,
        input.contentType,
        input.visibility,
      );
      return {
        key,
        url:
          input.visibility === 'public'
            ? `${stripTrailingSlash(config.publicBaseUrl)}/${key}`
            : `private-object://${config.bucket}/${key}`,
        localPath: null,
        visibility: input.visibility,
      };
    }

    const localPath = localPathForKey(key);
    mkdirSync(dirname(localPath), { recursive: true });
    writeFileSync(localPath, input.buffer);

    const url =
      input.visibility === 'public'
        ? `${stripTrailingSlash(input.uploadsBaseUrl || '')}/uploads/media/${key
            .split('/')
            .slice(1)
            .join('/')}`
        : `private-local://${key}`;

    return { key, url, localPath, visibility: input.visibility };
  }

  async exists(key: string): Promise<boolean> {
    assertStorageKey(key);
    if (this.driver === 's3') {
      return headS3Object(readS3Config(), key);
    }
    return existsSync(localPathForKey(key));
  }
}

export function buildContentAddressedMediaKey(
  contentHash: string,
  extension: string,
  visibility: MediaVisibility,
): string {
  const hash = contentHash.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(hash)) {
    throw new Error('invalid_media_content_hash');
  }
  const ext = extension.trim().toLowerCase().replace(/^\./, '');
  if (!/^[a-z0-9]{1,10}$/.test(ext)) {
    throw new Error('invalid_media_extension');
  }
  const prefix = visibility === 'public' ? 'public' : 'private';
  return `${prefix}/${hash.slice(0, 2)}/${hash}.${ext}`;
}

function assertStorageKey(key: string): void {
  if (!/^(public|private)\/[a-f0-9]{2}\/[a-f0-9]{64}\.[a-z0-9]{1,10}$/.test(key)) {
    throw new Error('invalid_media_storage_key');
  }
}

function localPathForKey(key: string): string {
  assertStorageKey(key);
  const [visibility, ...segments] = key.split('/');
  const root =
    visibility === 'public'
      ? join(process.cwd(), 'uploads', 'media')
      : join(process.cwd(), 'storage', 'private', 'media');
  return join(root, ...segments);
}

function resolveDriver(): MediaStorageDriver {
  const raw = (process.env.MEDIA_STORAGE_DRIVER || 'local')
    .trim()
    .toLowerCase();
  if (raw !== 'local' && raw !== 's3') {
    throw new Error('MEDIA_STORAGE_DRIVER must be local or s3.');
  }
  return raw;
}

function readS3Config(): S3Config {
  const endpoint = requiredEnv('MEDIA_S3_ENDPOINT');
  const publicBaseUrl = requiredEnv('MEDIA_PUBLIC_BASE_URL');
  return {
    endpoint: new URL(endpoint),
    region: requiredEnv('MEDIA_S3_REGION'),
    bucket: requiredEnv('MEDIA_S3_BUCKET'),
    accessKeyId: requiredEnv('MEDIA_S3_ACCESS_KEY_ID'),
    secretAccessKey: requiredEnv('MEDIA_S3_SECRET_ACCESS_KEY'),
    publicBaseUrl: stripTrailingSlash(publicBaseUrl),
  };
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required media storage variable ${name}.`);
  }
  return value;
}

async function putS3Object(
  config: S3Config,
  key: string,
  body: Buffer,
  contentType: string,
  visibility: MediaVisibility,
): Promise<void> {
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256(body);
  const canonicalUri = canonicalS3Uri(config, key);
  const host = config.endpoint.host;
  const cacheControl =
    visibility === 'public'
      ? 'public, max-age=31536000, immutable'
      : 'private, no-store';
  const canonicalHeaders =
    `cache-control:${cacheControl}\n` +
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders =
    'cache-control;content-type;host;x-amz-content-sha256;x-amz-date';
  const authorization = signS3Request({
    config,
    method: 'PUT',
    canonicalUri,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
    amzDate,
    dateStamp,
  });

  const target = s3Target(config, canonicalUri);
  const response = await fetch(target, {
    method: 'PUT',
    headers: {
      Authorization: authorization,
      'Cache-Control': cacheControl,
      'Content-Type': contentType,
      Host: host,
      'X-Amz-Content-Sha256': payloadHash,
      'X-Amz-Date': amzDate,
    },
    body: Uint8Array.from(body),
  });

  if (!response.ok) {
    throw new Error(`media_storage_put_failed:${response.status}`);
  }
}

async function headS3Object(config: S3Config, key: string): Promise<boolean> {
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256(Buffer.alloc(0));
  const canonicalUri = canonicalS3Uri(config, key);
  const host = config.endpoint.host;
  const canonicalHeaders =
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const authorization = signS3Request({
    config,
    method: 'HEAD',
    canonicalUri,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
    amzDate,
    dateStamp,
  });
  const response = await fetch(s3Target(config, canonicalUri), {
    method: 'HEAD',
    headers: {
      Authorization: authorization,
      Host: host,
      'X-Amz-Content-Sha256': payloadHash,
      'X-Amz-Date': amzDate,
    },
  });
  if (response.status === 404) return false;
  if (!response.ok) {
    throw new Error(`media_storage_head_failed:${response.status}`);
  }
  return true;
}

function signS3Request(input: {
  config: S3Config;
  method: 'PUT' | 'HEAD';
  canonicalUri: string;
  canonicalHeaders: string;
  signedHeaders: string;
  payloadHash: string;
  amzDate: string;
  dateStamp: string;
}): string {
  const canonicalRequest = [
    input.method,
    input.canonicalUri,
    '',
    input.canonicalHeaders,
    input.signedHeaders,
    input.payloadHash,
  ].join('\n');
  const scope = `${input.dateStamp}/${input.config.region}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    input.amzDate,
    scope,
    sha256(Buffer.from(canonicalRequest)),
  ].join('\n');
  const signingKey = getSignatureKey(
    input.config.secretAccessKey,
    input.dateStamp,
    input.config.region,
  );
  const signature = createHmac('sha256', signingKey)
    .update(stringToSign)
    .digest('hex');
  return (
    `AWS4-HMAC-SHA256 Credential=${input.config.accessKeyId}/${scope}, ` +
    `SignedHeaders=${input.signedHeaders}, Signature=${signature}`
  );
}

function canonicalS3Uri(config: S3Config, key: string): string {
  assertStorageKey(key);
  const encodedKey = key.split('/').map(encodeRfc3986).join('/');
  const bucket = encodeRfc3986(config.bucket);
  const basePath = config.endpoint.pathname.replace(/\/$/, '');
  return `${basePath}/${bucket}/${encodedKey}`.replace(/\/+/g, '/');
}

function s3Target(config: S3Config, canonicalUri: string): URL {
  const target = new URL(config.endpoint.toString());
  target.pathname = canonicalUri;
  target.search = '';
  return target;
}

function getSignatureKey(
  secret: string,
  dateStamp: string,
  region: string,
): Buffer {
  const kDate = hmac(`AWS4${secret}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, 's3');
  return hmac(kService, 'aws4_request');
}

function hmac(key: string | Buffer, value: string): Buffer {
  return createHmac('sha256', key).update(value).digest();
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function toAmzDate(date: Date): string {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '');
}

function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}
