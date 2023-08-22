import { numberToBuffer, padBufferStart, truncateToSeconds } from '../utils';
import { join } from 'path';

import AuthenticatedFile from './AuthenticatedFile';
import Certificate from './Certificate';
import { Subject } from './Config';

interface StateFile {
  crlSerial: Buffer;
  issuanceSerial: Buffer;
  index: Map<string, IndexEntry>;
}

interface IndexEntry {
  subject: Subject;
  issuanceDate: Date;
  revocationDate?: Date;
  workingPeriodEnd: Date;
  validityPeriodEnd: Date;
}

interface StateJson {
  crlSerial: string;
  issuanceSerial: string;
  index: CertificateIndexJson;
}

type CertificateIndexJson = {
  [key: string]: IndexEntry;
};

export class CertificateIndexEntry {
  public readonly serial: Buffer;
  public readonly subject: Subject;
  public readonly issuanceDate: Date;
  public readonly revocationDate?: Date;
  public readonly workingPeriodEnd: Date;
  public readonly validityPeriodEnd: Date;

  constructor(serial: Buffer, entry: IndexEntry) {
    this.serial = serial;
    this.subject = entry.subject;
    this.issuanceDate = entry.issuanceDate;
    this.revocationDate = entry.revocationDate;
    this.workingPeriodEnd = entry.workingPeriodEnd;
    this.validityPeriodEnd = entry.validityPeriodEnd;
  }

  public get isRevoked(): boolean {
    return !!this.revocationDate;
  }

  public get isExpired(): boolean {
    return this.validityPeriodEnd < new Date();
  }

  public get isUsable(): boolean {
    return !this.isRevoked && this.workingPeriodEnd > new Date();
  }

  public get isValid(): boolean {
    return !this.isRevoked && !this.isExpired;
  }

  /** @internal to State */
  public asEntry(): IndexEntry {
    return {
      subject: this.subject,
      issuanceDate: this.issuanceDate,
      revocationDate: this.revocationDate,
      workingPeriodEnd: this.workingPeriodEnd,
      validityPeriodEnd: this.validityPeriodEnd,
    };
  }
}

/** @internal utility for CRL */
export function readSerialNumber(serial: Buffer): number {
  switch (serial.byteLength) {
    case 1:
      return serial.readUInt8(0);
    case 2:
      return serial.readUInt16BE(0);
    case 3:
      return serial.readUInt16BE(0) * 0x100 + serial.readUInt8(2);
    default: {
      const offset = Math.max(0, serial.byteLength - 4);
      return serial.readUInt32BE(offset);
    }
  }
}

function incrementSerialNumber(serial: Buffer): [Buffer, Buffer] {
  const offset = Math.max(0, serial.byteLength - 4);
  const next = serial.readUInt32BE(offset) + 1;
  serial.writeUInt32BE(next, offset);

  return [serial, numberToBuffer(next)];
}

export default class State extends AuthenticatedFile {
  constructor(caPath: string, key: CryptoKey, createFile = false) {
    super(join(caPath, 'state.json'), key, createFile);
  }

  private async load(): Promise<StateFile> {
    const stateFile: StateJson = JSON.parse((await this.loadFile()).toString('utf-8'));

    const crlSerial = Buffer.from(stateFile.crlSerial, 'hex');
    if (crlSerial.byteLength < 8) throw new Error('CRL serial is under 64 bits');
    if (crlSerial.byteLength > 20) throw new Error('CRL serial is over 160 bits');

    const issuanceSerial = Buffer.from(stateFile.issuanceSerial, 'hex');
    if (issuanceSerial.byteLength < 8) throw new Error('Issuance serial is under 64 bits');
    if (issuanceSerial.byteLength > 20) throw new Error('Issuance serial is over 160 bits');

    const index: Map<string, IndexEntry> = new Map();
    for (const [serial, entry] of Object.entries(stateFile.index)) {
      const fullSerial = padBufferStart(Buffer.from(serial, 'hex'), issuanceSerial.byteLength);
      index.set(fullSerial.toString('hex'), {
        subject: entry.subject,
        issuanceDate: new Date(entry.issuanceDate),
        revocationDate: entry.revocationDate ? new Date(entry.revocationDate) : undefined,
        workingPeriodEnd: new Date(entry.workingPeriodEnd),
        validityPeriodEnd: new Date(entry.validityPeriodEnd),
      });
    }

    return {
      crlSerial,
      issuanceSerial,
      index,
    };
  }

  private async write(state: StateFile): Promise<void> {
    const index: CertificateIndexJson = {};
    for (const [serial, entry] of state.index) {
      index[serial] = entry;
    }

    const stateFile: StateJson = {
      crlSerial: state.crlSerial.toString('hex'),
      issuanceSerial: state.issuanceSerial.toString('hex'),
      index,
    };

    await this.writeFile(Buffer.from(JSON.stringify(stateFile, null, 2), 'utf-8'));
  }

  public async create(): Promise<void> {
    await this.write({
      crlSerial: Buffer.alloc(16),
      issuanceSerial: Buffer.alloc(16),
      index: new Map(),
    });
  }

  public async nextCrlSerial(): Promise<Buffer> {
    const state = await this.load();
    const [serial, next] = incrementSerialNumber(state.crlSerial);
    state.crlSerial = serial;
    await this.write(state);
    return next;
  }

  public async nextIssuanceSerial(): Promise<Buffer> {
    const state = await this.load();
    const [serial, next] = incrementSerialNumber(state.issuanceSerial);
    state.issuanceSerial = serial;
    await this.write(state);
    return next;
  }

  public async fromSerialNumber(serial: Buffer): Promise<CertificateIndexEntry | undefined> {
    const state = await this.load();
    const fullSerial = padBufferStart(serial, state.issuanceSerial.byteLength);
    const entry = state.index.get(fullSerial.toString('hex'));
    if (entry) return new CertificateIndexEntry(fullSerial, entry);
    return undefined;
  }

  public async revokedCertificates(): Promise<CertificateIndexEntry[]> {
    const state = await this.load();

    const list = [];
    for (const [serial, entry] of state.index.entries()) {
      const fullSerial = Buffer.from(serial, 'hex');
      const cert = new CertificateIndexEntry(fullSerial, entry);
      if (!cert.isExpired && cert.isRevoked) list.push(cert);
    }

    return list;
  }

  /**
   * @internal Do not use outside of CA classes (e.g. directly from commands).
   */
  public async indexNewCertificate(
    cert: Certificate,
    overrides?: Partial<IndexEntry>,
  ): Promise<void> {
    if (await this.fromSerialNumber(cert.serial)) {
      throw new Error('Certificate already exists in index');
    }

    const state = await this.load();
    const fullSerial = padBufferStart(cert.serial, state.issuanceSerial.byteLength);
    state.index.set(fullSerial.toString('hex'), Object.assign(cert.asIndexEntry(), overrides));
    await this.write(state);
  }

  /**
   * @internal Do not use outside of CA classes (e.g. directly from commands).
   */
  public async indexRevocation(serial: Buffer, date?: Date): Promise<void> {
    const entry = await this.fromSerialNumber(serial);
    if (!entry) {
      throw new Error('Certificate does not exist in index');
    }

    if (entry.isRevoked) {
      // should be caught earlier, here it's a programmer error
      throw new Error('Certificate is already revoked');
    }

    const state = await this.load();
    state.index.set(
      entry.serial.toString('hex'),
      Object.assign(entry.asEntry(), {
        revocationDate: truncateToSeconds(date ?? new Date()),
      }),
    );
    await this.write(state);
  }
}
