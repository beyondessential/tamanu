import { userInfo } from 'os';
import { join } from 'path';

import AuthenticatedFile from './AuthenticatedFile';

export default class Log extends AuthenticatedFile {
  constructor(caPath: string, key: CryptoKey, newfile: boolean = false) {
    super(join(caPath, 'log.ndjson'), key, newfile);
  }

  public async append(log: LogEntry) {
    // TODO: optimisation: we only need to append to the file (but sign
    // it all), so we should be able to append to the file directly
    // somehow, and then do a streaming sign.

    const file = await this.loadFile();
    const prepend =
      file.byteLength > 0 ? (file[file.length - 1] !== '\n'.charCodeAt(0) ? '\n' : '') : '';

    const logLine = Buffer.from(prepend + JSON.stringify(log) + '\n', 'utf-8');
    await this.writeFile(Buffer.concat([file, logLine]));
  }

  public async create() {
    await this.append({
      ts: new Date,
      op: Operation.Create,
      user: localUser(),
    });
  }
}

export interface LogEntry {
  ts: Date;
  op: Operation;
  user: string;
  // TODO: request metadata
}

export enum Operation {
  Create = 'create',
}

export function localUser(): string {
  return 'local:' + userInfo().username;
}
