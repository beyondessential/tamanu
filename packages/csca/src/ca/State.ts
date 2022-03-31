import { join } from 'path';

import AuthenticatedFile from './AuthenticatedFile';
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

    const index = new Map();
    for (const entry of stateFile.index) {
      const serial = Buffer.from(entry.serial, 'hex');
      const innerEntry = Object.assign({}, entry, { serial: undefined });
      index.set(serial, innerEntry);
    }

    return {
      crlSerial,
      issuanceSerial,
      index,
    };
  }

  private async write(state: StateFile) {
    const index = [];
    for (const [serial, entry] of state.index) {
      index.push({
        serial: serial.toString('hex'),
        ...entry,
      });
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

  // TODO: more useful index management APIs
  public async indexEntryFromSerial(serial: Buffer): Promise<CertificateIndexEntry> {
    const state = await this.load();
    const entry = state.index.get(serial);
    if (!entry) throw new Error('No such serial');
    return entry;
  }
}

interface StateFile {
  crlSerial: Buffer;
  issuanceSerial: Buffer;
  index: Map<Buffer, CertificateIndexEntry>;
}

interface StateJson {
  crlSerial: string;
  issuanceSerial: string;
  index: Array<CertificateIndexJson>;
}

export interface CertificateIndexEntry {
  subject: Subject;
  issuanceDate: Date;
  revocationDate: undefined | Date;
  workingPeriodEnd: Date;
  validityPeriodEnd: Date;
}

interface CertificateIndexJson {
  serial: string;
  subject: Subject;
  issuanceDate: Date;
  revocationDate: undefined | Date;
  workingPeriodEnd: Date;
  validityPeriodEnd: Date;
}
