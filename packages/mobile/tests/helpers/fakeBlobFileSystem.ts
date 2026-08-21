import { createHash } from 'crypto';

import { TransferFileSystem } from '~/services/blobs/BlobTransferChannel';

type DownloadOptions = Parameters<TransferFileSystem['downloadFile']>[0];
type UploadOptions = Parameters<TransferFileSystem['uploadFiles']>[0];

// An in-memory stand-in for the react-native-fs surface the blob services use.
// Paths are plain string keys; directories are not modelled since RNFS's mkdir
// is recursive and tolerant of existing directories.
export class FakeBlobFileSystem implements TransferFileSystem {
  files = new Map<string, Buffer>();

  totalSpace = 64 * 1024 ** 3;

  freeSpace = 32 * 1024 ** 3;

  onDownload: (options: DownloadOptions) => Promise<{ statusCode: number; bytesWritten: number }> =
    async () => {
      throw new Error('downloadFile not stubbed');
    };

  onUpload: (options: UploadOptions) => Promise<{ statusCode: number; body: string }> =
    async () => {
      throw new Error('uploadFiles not stubbed');
    };

  seed(path: string, contents: string | Buffer): void {
    this.files.set(path, Buffer.from(contents));
  }

  contentsOf(path: string): Buffer | undefined {
    return this.files.get(path);
  }

  #need(path: string): Buffer {
    const contents = this.files.get(path);
    if (contents === undefined) {
      throw new Error(`ENOENT: no such file: ${path}`);
    }
    return contents;
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path);
  }

  async stat(path: string): Promise<{ size: number }> {
    return { size: this.#need(path).length };
  }

  async hash(path: string, algorithm: string): Promise<string> {
    return createHash(algorithm).update(this.#need(path)).digest('hex');
  }

  async mkdir(): Promise<void> {}

  async moveFile(from: string, to: string): Promise<void> {
    this.files.set(to, this.#need(from));
    this.files.delete(from);
  }

  async unlink(path: string): Promise<void> {
    if (!this.files.delete(path)) {
      throw new Error(`ENOENT: no such file: ${path}`);
    }
  }

  async read(path: string, length: number, position: number, _encoding: string): Promise<string> {
    return this.#need(path)
      .subarray(position, position + length)
      .toString('base64');
  }

  async readFile(path: string, encoding: string): Promise<string> {
    return this.#need(path).toString(encoding as BufferEncoding);
  }

  async writeFile(path: string, contents: string, encoding: string): Promise<void> {
    this.files.set(path, Buffer.from(contents, encoding as BufferEncoding));
  }

  async appendFile(path: string, contents: string, encoding: string): Promise<void> {
    const previous = this.files.get(path) ?? Buffer.alloc(0);
    this.files.set(path, Buffer.concat([previous, Buffer.from(contents, encoding as BufferEncoding)]));
  }

  async getFSInfo(): Promise<{ totalSpace: number; freeSpace: number }> {
    return { totalSpace: this.totalSpace, freeSpace: this.freeSpace };
  }

  downloadFile(options: DownloadOptions): {
    jobId: number;
    promise: Promise<{ statusCode: number; bytesWritten: number }>;
  } {
    return { jobId: 1, promise: this.onDownload(options) };
  }

  uploadFiles(options: UploadOptions): {
    jobId: number;
    promise: Promise<{ statusCode: number; body: string }>;
  } {
    return { jobId: 1, promise: this.onUpload(options) };
  }
}

export const sha256Hash = (contents: string | Buffer): string =>
  `sha256:${createHash('sha256').update(contents).digest('hex')}`;
