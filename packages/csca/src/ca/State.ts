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
    if (crlSerial.byteLength !== 4) throw new Error('CRL serial is not 4 bytes');

    const issuanceSerial = Buffer.from(stateFile.crlSerial, 'hex');
    if (issuanceSerial.byteLength !== 4) throw new Error('Issuance serial is not 4 bytes');

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
      crlSerial: Buffer.alloc(4),
      issuanceSerial: Buffer.alloc(4),
      index: new Map(),
    });
  }

  public async nextCrlSerial(): Promise<Buffer> {
    const state = await this.load();
    const next = state.crlSerial.readUInt32BE() + 1;
    state.crlSerial.writeUInt32BE(next);
    await this.write(state);
    return Buffer.from(state.crlSerial);
  }

  public async nextIssuanceSerial(): Promise<Buffer> {
    const state = await this.load();
    const next = state.issuanceSerial.readUInt32BE() + 1;
    state.issuanceSerial.writeUInt32BE(next);
    await this.write(state);
    return Buffer.from(state.issuanceSerial);
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
