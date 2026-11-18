import { access, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  COMMUNICATION_STATUSES,
  PATIENT_COMMUNICATION_CHANNELS,
  PATIENT_COMMUNICATION_TYPES,
} from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { tmpdir } from '@tamanu/shared/utils';

import { PatientEmailCommunicationProcessor } from '../../app/tasks/PatientEmailCommunicationProcessor';
import { isGeneratedFile } from '../../app/utils/files';
import { createTestContext } from '../utilities';

vi.mock('../../app/services/mailConfig', () => ({
  getDefaultFromAddress: vi.fn().mockResolvedValue('tamanu@example.com'),
}));

const exists = path =>
  access(path).then(
    () => true,
    () => false,
  );

describe('PatientEmailCommunicationProcessor', () => {
  let ctx;
  let patient;
  let processor;
  let generatedFile;
  let otherDirectory;
  let otherFile;

  const queueEmail = (attachment, overrides = {}) =>
    ctx.store.models.PatientCommunication.create({
      type: PATIENT_COMMUNICATION_TYPES.CERTIFICATE,
      channel: PATIENT_COMMUNICATION_CHANNELS.EMAIL,
      status: COMMUNICATION_STATUSES.QUEUED,
      subject: 'Subject',
      content: 'Content',
      destination: 'patient@example.com',
      patientId: patient.id,
      attachment,
      ...overrides,
    });

  beforeAll(async () => {
    ctx = await createTestContext();
    patient = await ctx.store.models.Patient.create(fake(ctx.store.models.Patient));
    processor = new PatientEmailCommunicationProcessor(ctx);
  });

  beforeEach(async () => {
    await ctx.store.models.PatientCommunication.destroy({ where: {}, force: true });
    ctx.emailService.sendEmail.mockClear();

    // central writes the files it generates straight into its temp directory
    generatedFile = path.join(await tmpdir(), `generated-${Date.now()}.pdf`);
    await writeFile(generatedFile, 'generated');
    otherDirectory = await mkdtemp(path.join(await tmpdir(), 'other-'));
    otherFile = path.join(otherDirectory, 'secret.txt');
    await writeFile(otherFile, 'secret');
  });

  afterAll(async () => {
    await rm(otherDirectory, { recursive: true, force: true });
    await rm(generatedFile, { force: true });
    await ctx.close();
  });

  it('sends a file central generated, then removes it', async () => {
    const email = await queueEmail(generatedFile);

    await processor.processEmails();

    expect(ctx.emailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ attachment: generatedFile }),
    );
    await email.reload();
    expect(email.status).toBe(COMMUNICATION_STATUSES.SENT);
    expect(await exists(generatedFile)).toBe(false);
  });

  it('sends an email without an attachment', async () => {
    const email = await queueEmail(null);

    await processor.processEmails();

    expect(ctx.emailService.sendEmail).toHaveBeenCalledOnce();
    await email.reload();
    expect(email.status).toBe(COMMUNICATION_STATUSES.SENT);
  });

  it.each([
    ['a destination', { destination: 'a@example.com\r\nBcc: b@example.com' }],
    ['the patient address it falls back to', { destination: null, useBadPatientEmail: true }],
  ])('does not send to %s that is not a single address', async (_name, overrides) => {
    const { useBadPatientEmail, ...fields } = overrides;
    const recipient = useBadPatientEmail
      ? await ctx.store.models.Patient.create(
          fake(ctx.store.models.Patient, { email: 'a@example.com, b@example.com' }),
        )
      : patient;
    const email = await queueEmail(null, { ...fields, patientId: recipient.id });

    await processor.processEmails();

    expect(ctx.emailService.sendEmail).not.toHaveBeenCalled();
    await email.reload();
    expect(email.status).toBe(COMMUNICATION_STATUSES.BAD_FORMAT);
    expect(email.error).toBe('Invalid destination address');
  });

  it('neither sends nor removes a file it did not generate', async () => {
    const email = await queueEmail(otherFile);

    await processor.processEmails();

    expect(ctx.emailService.sendEmail).not.toHaveBeenCalled();
    await email.reload();
    expect(email.status).toBe(COMMUNICATION_STATUSES.BAD_FORMAT);
    expect(email.error).toBe('Invalid attachment');
    expect(await exists(otherFile)).toBe(true);
  });
});

describe('isGeneratedFile', () => {
  let directory;
  let outside;

  beforeAll(async () => {
    directory = await tmpdir();
    outside = await mkdtemp(path.join(directory, 'outside-'));
    await writeFile(path.join(outside, 'secret.txt'), 'secret');
  });

  afterAll(async () => {
    await rm(outside, { recursive: true, force: true });
  });

  it('accepts a file this process wrote directly in the temp directory', async () => {
    const filePath = path.join(directory, `generated-${Date.now()}.pdf`);
    await writeFile(filePath, 'generated');
    try {
      expect(await isGeneratedFile(filePath)).toBe(true);
    } finally {
      await rm(filePath, { force: true });
    }
  });

  it('rejects a link in the temp directory to a file elsewhere', async () => {
    const linkPath = path.join(directory, `link-${Date.now()}.pdf`);
    await symlink(path.join(outside, 'secret.txt'), linkPath);
    try {
      expect(await isGeneratedFile(linkPath)).toBe(false);
    } finally {
      await rm(linkPath, { force: true });
    }
  });

  it('rejects a path in the temp directory with no file', async () => {
    expect(await isGeneratedFile(path.join(directory, 'missing.pdf'))).toBe(false);
  });

  it.each([
    ['a file in a subdirectory of the temp directory', () => [outside, 'secret.txt']],
    ['a path that climbs out of the temp directory', () => [directory, '..', 'etc', 'passwd']],
    [
      'a path that climbs out and back in',
      () => [outside, '..', '..', path.basename(directory), path.basename(outside), 'secret.txt'],
    ],
  ])('rejects %s', async (_name, segments) => {
    expect(await isGeneratedFile(segments().join('/'))).toBe(false);
  });

  it('rejects an absolute path elsewhere', async () => {
    expect(await isGeneratedFile('/etc/passwd')).toBe(false);
  });
});
