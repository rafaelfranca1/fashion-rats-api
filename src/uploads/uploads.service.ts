import {
  BadRequestException,
  Inject,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { STORAGE_PORT, StoragePort } from '../storage/storage.port';
import {
  ALLOWED_PREFIXES,
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
} from './upload.constants';

export type UploadFile = {
  buffer: Buffer;
  mimetype: string;
  size: number;
};

export type UploadResponse = { url: string };

@Injectable()
export class UploadsService {
  constructor(@Inject(STORAGE_PORT) private readonly storage: StoragePort) {}

  async upload(
    prefixRaw: string | undefined,
    ownerIdRaw: string | undefined,
    file: UploadFile | undefined,
    publicBaseUrl: string,
  ): Promise<UploadResponse> {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    const prefix = parsePrefix(prefixRaw);
    const ownerId = parseOptionalOwnerId(ownerIdRaw);

    if (!Object.hasOwn(ALLOWED_UPLOAD_TYPES, file.mimetype)) {
      throw new BadRequestException('unsupported file type');
    }
    const ext = ALLOWED_UPLOAD_TYPES[file.mimetype];

    if (file.size > MAX_UPLOAD_BYTES) {
      throw new PayloadTooLargeException();
    }

    const key =
      ownerId === null
        ? `${prefix}/${randomUUID()}.${ext}`
        : `${prefix}/${ownerId}/${randomUUID()}.${ext}`;

    await this.storage.save(key, file.buffer);

    return { url: `${publicBaseUrl}/uploads/${key}` };
  }
}

function parsePrefix(raw: string | undefined): string {
  if (raw === undefined || raw.trim() === '') {
    throw new BadRequestException('prefix is required');
  }

  const trimmed = raw.trim();
  if (!ALLOWED_PREFIXES.has(trimmed)) {
    throw new BadRequestException('unsupported prefix');
  }

  return trimmed;
}

function parseOptionalOwnerId(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === '') {
    return null;
  }

  const trimmed = raw.trim();
  const ownerId = Number.parseInt(trimmed, 10);

  if (
    !Number.isInteger(ownerId) ||
    ownerId < 1 ||
    String(ownerId) !== trimmed
  ) {
    throw new BadRequestException('ownerId must be a positive integer');
  }

  return ownerId;
}
