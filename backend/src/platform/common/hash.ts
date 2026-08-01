import { createHash } from 'crypto';

export function sha256(buffer: Buffer | string): string {
  return createHash('sha256').update(buffer).digest('hex');
}

export function sha256HexShort(buffer: Buffer | string, len = 16): string {
  return sha256(buffer).slice(0, len);
}
