import { beforeEach, describe, expect, it, vi } from 'vitest';

import { saveFile } from '../../app/utils/fileSystemAccess';

// A save that cannot produce its content has to leave nothing behind. Content is
// resolved through a callback, and an attachment whose bytes have not arrived
// rejects there routinely rather than exceptionally, so the failure path is the
// common one rather than the edge.
describe('saveFile', () => {
  let writable;
  let fileHandle;

  beforeEach(() => {
    writable = { write: vi.fn(), close: vi.fn(), abort: vi.fn() };
    fileHandle = { createWritable: vi.fn(async () => writable) };
    window.showSaveFilePicker = vi.fn(async () => fileHandle);
  });

  const save = getData =>
    saveFile({ defaultFileName: 'discharge summary', getData, mimetype: 'application/pdf' });

  it('writes the content the caller produced', async () => {
    const data = new Uint8Array([1, 2, 3]);

    await expect(save(async () => data)).resolves.toBe(true);

    expect(writable.write).toHaveBeenCalledWith(data);
    expect(writable.close).toHaveBeenCalled();
    expect(writable.abort).not.toHaveBeenCalled();
  });

  it('opens no writable at all when the content cannot be produced', async () => {
    const failure = new Error('content is not available yet');

    await expect(save(async () => Promise.reject(failure))).rejects.toBe(failure);

    // Nothing to abort, because nothing was opened: a writable created alongside
    // the content would be unreachable once the pair rejected.
    expect(fileHandle.createWritable).not.toHaveBeenCalled();
  });

  it('aborts the writable when writing fails', async () => {
    const failure = new Error('disk went away');
    writable.write.mockRejectedValueOnce(failure);

    await expect(save(async () => new Uint8Array([1]))).rejects.toBe(failure);

    expect(writable.abort).toHaveBeenCalled();
    expect(writable.close).not.toHaveBeenCalled();
  });

  it('reports a cancelled picker as not saved rather than as a failure', async () => {
    const aborted = new Error('user cancelled');
    aborted.name = 'AbortError';
    window.showSaveFilePicker.mockRejectedValueOnce(aborted);

    await expect(save(async () => new Uint8Array([1]))).resolves.toBe(false);
  });
});
