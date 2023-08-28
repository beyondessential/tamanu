import { hostname, userInfo } from 'os';
import { join } from 'path';

import AuthenticatedFile from './AuthenticatedFile';
import Certificate from './Certificate';
import { ConfigFile } from './Config';
import Crl from './Crl';

export enum Operation {
  Creation = 'creation',
  Reconfiguration = 'reconfiguration',
  Issuance = 'issuance',
  Revocation = 'revocation',
  CrlGeneration = 'crl-generation',
}

export interface LogMetadata {
  slot?: string;
  user?: string;
  hostname?: string;
}

export interface LogEntry {
  ts: Date;
  op: Operation;
  metadata: LogMetadata;
  data?: object;
}

function localMetadata(): LogMetadata {
  return {
    user: userInfo().username,
    hostname: hostname(),
  };
}

export default class Log extends AuthenticatedFile {
  constructor(caPath: string, key: CryptoKey, createFile = false) {
    super(join(caPath, 'log.ndjson'), key, createFile);
  }

  private async append(log: LogEntry): Promise<void> {
    // TODO: optimisation: we only need to append to the file (but sign
    // it all), so we should be able to append to the file directly
    // somehow, and then do a streaming sign.

    const file = await this.loadFile();

    let prepend = '';
    if (file.byteLength > 0 && file[file.length - 1] !== '\n'.charCodeAt(0)) prepend = '\n';

    const logLine = Buffer.from(`${prepend + JSON.stringify(log)}\n`, 'utf-8');
    await this.writeFile(Buffer.concat([file, logLine]));
  }

  public async create(config: ConfigFile): Promise<void> {
    await this.append({
      ts: new Date(),
      op: Operation.Creation,
      metadata: localMetadata(),
      data: config,
    });
  }

  public async reconfig(config: ConfigFile): Promise<void> {
    await this.append({
      ts: new Date(),
      op: Operation.Reconfiguration,
      metadata: localMetadata(),
      data: config,
    });
  }

  public async issue(cert: Certificate): Promise<void> {
    await this.append({
      ts: new Date(),
      op: Operation.Issuance,
      metadata: localMetadata(),
      data: { ...cert.asIndexEntry(), serial: cert.serial.toString('hex') },
    });
  }

  public async revoke(serial: Buffer, date: Date): Promise<void> {
    await this.append({
      ts: new Date(),
      op: Operation.Revocation,
      metadata: localMetadata(),
      data: { serial: serial.toString('hex'), revocationDate: date },
    });
  }

  public async generateCrl(crl: Crl): Promise<void> {
    await this.append({
      ts: new Date(),
      op: Operation.CrlGeneration,
      metadata: localMetadata(),
      data: { serial: (await crl.serial()).toString('hex'), date: await crl.date() },
    });
  }
}
