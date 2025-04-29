import { Buffer } from 'buffer';

export interface StatusListData {
  id: string;

  statusPurpose: string;

  bitstring: Buffer;

  bitLength: number;

  byteLength: number;

  lastUpdateAt?: Date;
}
