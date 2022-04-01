import { hostname, userInfo } from 'os';
import { join } from 'path';

import AuthenticatedFile from './AuthenticatedFile';
import Certificate from './Certificate';
import { ConfigFile } from './Config';

export default class Log extends AuthenticatedFile {
  constructor(caPath: string, key: CryptoKey, newfile: boolean = false) {
    super(join(caPath, 'log.ndjson'), key, newfile);
  }

  private async append(log: LogEntry) {
    // TODO: optimisation: we only need to append to the file (but sign
    // it all), so we should be able to append to the file directly
    // somehow, and then do a streaming sign.

    const file = await this.loadFile();
    const prepend =
      file.byteLength > 0 ? (file[file.length - 1] !== '\n'.charCodeAt(0) ? '\n' : '') : '';

    const logLine = Buffer.from(prepend + JSON.stringify(log) + '\n', 'utf-8');
    await this.writeFile(Buffer.concat([file, logLine]));
  }

  public async create(config: ConfigFile) {
    await this.append({
      ts: new Date(),
      op: Operation.Create,
      metadata: localMetadata(),
      data: config,
    });
  }

  public async issue(cert: Certificate) {
    await this.append({
      ts: new Date(),
      op: Operation.Issuance,
      metadata: localMetadata(),
      data: { ...cert.asIndexEntry(), serial: cert.serial.toString('hex') },
    });
  }

  public async revoke(serial: Buffer, date: Date) {
    await this.append({
      ts: new Date(),
      op: Operation.Revocation,
      metadata: localMetadata(),
      data: { serial: serial.toString('hex'), revocationDate: date },
    });
  }
}

export interface LogEntry {
  ts: Date;
  op: Operation;
  metadata: LogMetadata;
  data?: any;
}

export enum Operation {
  Create = 'creation',
  Issuance = 'issuance',
  Revocation = 'revocation',
}

export function localMetadata(): LogMetadata {
  return {
    user: userInfo().username,
    hostname: hostname(),
  };
}

export interface LogMetadata {
  slot?: string;
  user?: string;
  hostname?: string;
}
