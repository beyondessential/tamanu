import { join } from 'path';
import { padBufferStart } from '../utils';

import AuthenticatedFile from './AuthenticatedFile';
import Certificate from './Certificate';
import { Subject } from './Config';

export default class State extends AuthenticatedFile {
  constructor(caPath: string, key: CryptoKey, newfile: boolean = false) {
    super(join(caPath, 'state.json'), key, newfile);
  }

  private async load(): Promise<StateFile> {
    const stateFile: StateJson = JSON.parse((await this.loadFile()).toString('utf-8'));

    const crlSerial = Buffer.from(stateFile.crlSerial, 'hex');
    if (crlSerial.byteLength < 8) throw new Error('CRL serial is under 64 bits');
    if (crlSerial.byteLength > 20) throw new Error('CRL serial is over 160 bits');

    const issuanceSerial = Buffer.from(stateFile.issuanceSerial, 'hex');
    if (issuanceSerial.byteLength < 8) throw new Error('Issuance serial is under 64 bits');
    if (issuanceSerial.byteLength > 20) throw new Error('Issuance serial is over 160 bits');

    const index: Map<Buffer, IndexEntry> = new Map();
    for (const [serial, entry] of Object.entries(stateFile.index)) {
      const fullSerial = padBufferStart(Buffer.from(serial, 'hex'), issuanceSerial.byteLength);
      index.set(fullSerial, entry);
    }

    return {
      crlSerial,
      issuanceSerial,
      index,
    };
  }

  private async write(state: StateFile) {
    const index: CertificateIndexJson = {};
    for (const [serial, entry] of state.index) {
      index[serial.toString('hex')] = entry;
    }

    const stateFile: StateJson = {
      crlSerial: state.crlSerial.toString('hex'),
      issuanceSerial: state.issuanceSerial.toString('hex'),
      index,
    };

    await this.writeFile(Buffer.from(JSON.stringify(stateFile, null, 2), 'utf-8'));
  }

  public async create() {
    await this.write({
      crlSerial: Buffer.alloc(16),
      issuanceSerial: Buffer.alloc(16),
      index: new Map(),
    });
  }

  private incrementSerial(serial: Buffer): [Buffer, Buffer] {
    const offset = serial.byteLength - 4;
    const next = serial.readUInt32BE(offset) + 1;
    serial.writeUInt32BE(next, offset);

    let nextHex = next.toString(16);
    const nextHexLen = nextHex.length;
    nextHex = nextHex.padStart(nextHexLen % 2 === 0 ? nextHexLen : nextHexLen + 1, '0');
    const minimallyPadded = Buffer.from(nextHex, 'hex');

    return [serial, minimallyPadded];
  }

  public async nextCrlSerial(): Promise<Buffer> {
    const state = await this.load();
    const [serial, next] = this.incrementSerial(state.crlSerial);
    state.crlSerial = serial;
    await this.write(state);
    return next;
  }

  public async nextIssuanceSerial(): Promise<Buffer> {
    const state = await this.load();
    const [serial, next] = this.incrementSerial(state.issuanceSerial);
    state.issuanceSerial = serial;
    await this.write(state);
    return next;
  }

  public async fromSerial(serial: Buffer): Promise<CertificateIndexEntry | undefined> {
    const state = await this.load();
    const entry = state.index.get(padBufferStart(serial, state.issuanceSerial.byteLength));
    if (entry) return new CertificateIndexEntry(entry);
  }

  /**
   * @internal Do not use outside of CA classes (e.g. directly from commands).
   */
  public async indexNewCertificate(cert: Certificate) {
    if ((await this.fromSerial(cert.serial)) !== undefined) {
      throw new Error('Certificate already exists in index');
    }

    const state = await this.load();
    const fullSerial = padBufferStart(cert.serial, state.issuanceSerial.byteLength);
    state.index.set(fullSerial, cert.asIndexEntry());
    await this.write(state);
  }
}

export class CertificateIndexEntry {
  public readonly subject: Subject;
  public readonly issuanceDate: Date;
  public readonly revocationDate?: Date;
  public readonly workingPeriodEnd: Date;
  public readonly validityPeriodEnd: Date;

  constructor(entry: IndexEntry) {
    this.subject = entry.subject;
    this.issuanceDate = entry.issuanceDate;
    this.revocationDate = entry.revocationDate;
    this.workingPeriodEnd = entry.workingPeriodEnd;
    this.validityPeriodEnd = entry.validityPeriodEnd;
  }

  public get isRevoked(): boolean {
    return this.revocationDate !== undefined;
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
}

interface StateFile {
  crlSerial: Buffer;
  issuanceSerial: Buffer;
  index: Map<Buffer, IndexEntry>;
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
}
