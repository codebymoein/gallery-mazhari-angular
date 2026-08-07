import { Injectable } from '@nestjs/common';

export type MalwareScanResult =
  | { status: 'clean' }
  | { status: 'infected'; signature: string }
  | { status: 'unavailable'; reason: string };

@Injectable()
export class MediaSecurityService {
  async scan(buffer: Buffer): Promise<MalwareScanResult> {
    const mode = (process.env.MEDIA_MALWARE_SCAN_MODE || 'disabled')
      .trim()
      .toLowerCase();

    if (mode === 'disabled') {
      return { status: 'clean' };
    }
    if (mode !== 'http') {
      return { status: 'unavailable', reason: 'invalid_scan_mode' };
    }

    const endpoint = process.env.MEDIA_MALWARE_SCAN_URL?.trim();
    if (!endpoint) {
      return { status: 'unavailable', reason: 'scan_endpoint_missing' };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Media-Scan-Protocol': 'gallery-mazhari-v1',
        },
        body: Uint8Array.from(buffer),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        return {
          status: 'unavailable',
          reason: `scan_http_${response.status}`,
        };
      }
      const payload = (await response.json()) as {
        clean?: boolean;
        signature?: string;
      };
      if (payload.clean === true) {
        return { status: 'clean' };
      }
      if (payload.clean === false) {
        return {
          status: 'infected',
          signature: payload.signature?.trim() || 'malware_detected',
        };
      }
      return { status: 'unavailable', reason: 'scan_response_invalid' };
    } catch (error) {
      return {
        status: 'unavailable',
        reason: error instanceof Error ? error.name : 'scan_request_failed',
      };
    }
  }
}
