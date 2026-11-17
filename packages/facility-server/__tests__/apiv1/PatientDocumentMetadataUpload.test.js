import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { createTestContext } from '../utilities';
import { uploadAttachment } from '../../app/utils/uploadAttachment';
import { CentralServerConnection } from '../../app/sync/CentralServerConnection';

const { uploadAttachment: realUploadAttachment } = await vi.importActual(
  '../../app/utils/uploadAttachment',
);

describe('Document upload file handling', () => {
  let ctx;
  let models;
  let app;
  let patient;
  let encounter;
  let dir;
  let file;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    app = await ctx.baseApp.asRole('practitioner');
    patient = await models.Patient.create(await createDummyPatient(models));
    encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });
  });

  beforeEach(async () => {
    uploadAttachment.mockImplementation(realUploadAttachment);
    CentralServerConnection.mockClear();
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'document-upload-'));
    file = path.join(dir, 'secret.txt');
    await fs.writeFile(file, 'not for upload');
  });

  afterAll(async () => {
    uploadAttachment.mockReset();
    await ctx.close();
  });

  it.each([
    ['patient', () => `/api/patient/${patient.id}/documentMetadata`],
    ['encounter', () => `/api/encounter/${encounter.id}/documentMetadata`],
  ])(
    'refuses a file path sent in a JSON body to the %s document endpoint',
    async (_, endpoint) => {
      const result = await app.post(endpoint()).send({
        name: 'injected',
        type: 'text/plain',
        file,
        deleteFileAfterImport: true,
      });

      expect(result).toHaveRequestError();
      expect(CentralServerConnection).not.toHaveBeenCalled();
      await expect(fs.readFile(file, 'utf8')).resolves.toBe('not for upload');
      expect(await models.DocumentMetadata.count({ where: { name: 'injected' } })).toBe(0);
      await fs.rm(dir, { recursive: true });
    },
  );
});
