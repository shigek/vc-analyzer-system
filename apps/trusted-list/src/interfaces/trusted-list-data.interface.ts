import { Buffer } from 'buffer';

export interface TrustedListData {
  id: string;

  statusPurpose: string;

  bitstring: Buffer;

  bitLength: number;

  byteLength: number;

  lastUpdateAt?: Date;
}
