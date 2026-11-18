import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  COMMUNICATION_STATUSES,
  GENERIC_SURVEY_EXPORT_REPORT_ID,
  PATIENT_COMMUNICATION_CHANNELS,
  PATIENT_COMMUNICATION_TYPES,
  REPORT_DEFAULT_DATE_RANGES,
  REPORT_EXPORT_FORMATS,
  REPORT_REQUEST_STATUSES,
  REPORT_STATUSES,
} from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { log } from '@tamanu/shared/services/logging/log';
import {
  setHardcodedPermissionsUseForTestsOnly,
  unsetUseHardcodedPermissionsUseForTestsOnly,
} from '@tamanu/shared/permissions/rolesToPermissions';
import { fakeUUID } from '@tamanu/utils/generateId';

import { saveChangesForModel } from '../../src/sync';
import { closeDatabase, createTestDatabase } from '../utilities';

const pushToCentral = (model, data) =>
  saveChangesForModel(model, [{ data, isDeleted: false }], true, log);

describe('records pushed to central', () => {
  let models;

  beforeAll(async () => {
    setHardcodedPermissionsUseForTestsOnly(false);
    const database = await createTestDatabase();
    models = database.models;
  });

  afterAll(async () => {
    unsetUseHardcodedPermissionsUseForTestsOnly();
    await closeDatabase();
  });

  describe('PatientCommunication', () => {
    let patient;

    const communication = overrides => ({
      id: fakeUUID(),
      type: PATIENT_COMMUNICATION_TYPES.CERTIFICATE,
      channel: PATIENT_COMMUNICATION_CHANNELS.EMAIL,
      status: COMMUNICATION_STATUSES.QUEUED,
      subject: 'Subject',
      content: 'Content',
      destination: 'patient@example.com',
      patientId: patient.id,
      ...overrides,
    });

    beforeAll(async () => {
      patient = await models.Patient.create(fake(models.Patient));
    });

    it('stores a queued email to a valid address as queued', async () => {
      const pushed = communication();
      await pushToCentral(models.PatientCommunication, pushed);

      const stored = await models.PatientCommunication.findByPk(pushed.id);
      expect(stored).toMatchObject({
        status: COMMUNICATION_STATUSES.QUEUED,
        destination: 'patient@example.com',
        error: null,
      });
    });

    it.each([
      ['no', null],
      ['an empty', ''],
    ])('stores a queued email with %s destination as queued', async (_name, destination) => {
      const pushed = communication({ destination });
      await pushToCentral(models.PatientCommunication, pushed);

      const stored = await models.PatientCommunication.findByPk(pushed.id);
      expect(stored.status).toBe(COMMUNICATION_STATUSES.QUEUED);
    });

    it('never stores an attachment', async () => {
      const pushed = communication({ attachment: '/etc/passwd' });
      await pushToCentral(models.PatientCommunication, pushed);

      const stored = await models.PatientCommunication.findByPk(pushed.id);
      expect(stored.attachment).toBeNull();
    });

    it('leaves the attachment of an existing record alone when an update carries one', async () => {
      const existing = await models.PatientCommunication.create(
        communication({ attachment: '/tmp/generated.pdf' }),
      );
      await pushToCentral(models.PatientCommunication, {
        ...existing.get({ plain: true }),
        attachment: '/etc/passwd',
      });

      await existing.reload();
      expect(existing.attachment).toBe('/tmp/generated.pdf');
    });

    it.each([
      ['a list of addresses', 'a@example.com,b@example.com'],
      ['an address with a display name', 'Someone <a@example.com>'],
      ['an address with a header break', 'a@example.com\r\nBcc: b@example.com'],
      ['text', 'not an address'],
    ])('stores %s as a destination in bad format', async (_name, destination) => {
      for (const channel of [
        PATIENT_COMMUNICATION_CHANNELS.EMAIL,
        PATIENT_COMMUNICATION_CHANNELS.PORTAL_EMAIL,
      ]) {
        const pushed = communication({ destination, channel });
        await pushToCentral(models.PatientCommunication, pushed);

        const stored = await models.PatientCommunication.findByPk(pushed.id);
        expect(stored.status).toBe(COMMUNICATION_STATUSES.BAD_FORMAT);
        expect(stored.error).toBe('Invalid destination address');
      }
    });

    it('accepts a destination that is not an email address on a channel that does not use one', async () => {
      const pushed = communication({
        channel: PATIENT_COMMUNICATION_CHANNELS.SMS,
        destination: '+64211234567',
      });
      await pushToCentral(models.PatientCommunication, pushed);

      const stored = await models.PatientCommunication.findByPk(pushed.id);
      expect(stored.status).toBe(COMMUNICATION_STATUSES.QUEUED);
    });
  });

  describe('ReportRequest', () => {
    let owner;
    let permittedVersionId;
    let restrictedVersionId;
    let permittedUser;
    let unpermittedUser;

    const reportRequest = overrides => ({
      id: fakeUUID(),
      recipients: JSON.stringify({ email: ['recipient@example.com'] }),
      parameters: JSON.stringify({}),
      status: REPORT_REQUEST_STATUSES.RECEIVED,
      exportFormat: REPORT_EXPORT_FORMATS.XLSX,
      reportDefinitionVersionId: permittedVersionId,
      requestedByUserId: permittedUser.id,
      ...overrides,
    });

    const makeReport = async () => {
      const definition = await models.ReportDefinition.create(fake(models.ReportDefinition));
      const version = await models.ReportDefinitionVersion.create(
        fake(models.ReportDefinitionVersion, {
          id: `${definition.id}_version-1`,
          versionNumber: 1,
          reportDefinitionId: definition.id,
          status: REPORT_STATUSES.PUBLISHED,
          query: 'SELECT 1+1 AS test_column',
          queryOptions: JSON.stringify({
            parameters: [],
            dataSources: [],
            defaultDateRange: REPORT_DEFAULT_DATE_RANGES.ALL_TIME,
          }),
          userId: owner.id,
        }),
      );
      return { definition, version };
    };

    const makeUserWithPermissions = async permissions => {
      const role = await models.Role.create(fake(models.Role));
      await models.Permission.bulkCreate(
        permissions.map(([verb, noun, objectId]) => ({ roleId: role.id, verb, noun, objectId })),
      );
      return models.User.create(fake(models.User, { role: role.id }));
    };

    beforeAll(async () => {
      owner = await models.User.create(fake(models.User));
      const permitted = await makeReport();
      const restricted = await makeReport();
      permittedVersionId = permitted.version.id;
      restrictedVersionId = restricted.version.id;
      permittedUser = await makeUserWithPermissions([
        ['run', 'ReportDefinition', permitted.definition.id],
      ]);
      unpermittedUser = await makeUserWithPermissions([]);
    });

    const pushAndRead = async data => {
      await pushToCentral(models.ReportRequest, data);
      return models.ReportRequest.findByPk(data.id);
    };

    it('stores a request for a permitted report to valid addresses as received', async () => {
      const stored = await pushAndRead(reportRequest());

      expect(stored.status).toBe(REPORT_REQUEST_STATUSES.RECEIVED);
      expect(stored.recipients).toBe(JSON.stringify({ email: ['recipient@example.com'] }));
    });

    it('accepts recipients as a plain comma separated string', async () => {
      const stored = await pushAndRead(
        reportRequest({ recipients: 'one@example.com, two@example.com' }),
      );

      expect(stored.status).toBe(REPORT_REQUEST_STATUSES.RECEIVED);
      expect(stored.getRecipients()).toEqual({ email: ['one@example.com', 'two@example.com'] });
    });

    it('keeps only the email recipients', async () => {
      const stored = await pushAndRead(
        reportRequest({
          recipients: JSON.stringify({
            email: ['recipient@example.com'],
            local: [{ format: 'csv', path: '/tmp/anywhere' }],
            s3: true,
          }),
        }),
      );

      expect(stored.status).toBe(REPORT_REQUEST_STATUSES.RECEIVED);
      expect(stored.recipients).toBe(JSON.stringify({ email: ['recipient@example.com'] }));
    });

    it.each([
      ['local recipients only', JSON.stringify({ local: [{ format: 'csv', path: '/tmp/x' }] })],
      ['an empty list', JSON.stringify({ email: [] })],
      ['an invalid address', JSON.stringify({ email: ['recipient@example.com', 'nope'] })],
      ['a list in one string', JSON.stringify({ email: ['a@example.com,b@example.com'] })],
      ['a non-list', JSON.stringify({ email: 'recipient@example.com' })],
      ['no value', ''],
    ])('stores a request with %s as an error', async (_name, recipients) => {
      const stored = await pushAndRead(reportRequest({ recipients }));

      expect(stored.status).toBe(REPORT_REQUEST_STATUSES.ERROR);
      expect(stored.error).toBe('Invalid recipients');
      expect(stored.getRecipients()).toEqual({ email: [] });
    });

    it('stores a request by a user who cannot run the report as an error', async () => {
      const stored = await pushAndRead(reportRequest({ reportDefinitionVersionId: restrictedVersionId }));

      expect(stored.status).toBe(REPORT_REQUEST_STATUSES.ERROR);
      expect(stored.error).toBe('Requesting user cannot run this report');
    });

    it('stores a request by a user with no permissions as an error', async () => {
      const stored = await pushAndRead(reportRequest({ requestedByUserId: unpermittedUser.id }));

      expect(stored.status).toBe(REPORT_REQUEST_STATUSES.ERROR);
    });

    it('stores a request for a report that does not exist as an error', async () => {
      const stored = await pushAndRead(
        reportRequest({ reportDefinitionVersionId: null, reportType: 'no-such-report' }),
      );

      expect(stored.status).toBe(REPORT_REQUEST_STATUSES.ERROR);
    });

    it('holds a request for a report named by its legacy type to the same permission', async () => {
      const stored = await pushAndRead(
        reportRequest({ reportDefinitionVersionId: null, reportType: restrictedVersionId }),
      );

      expect(stored.status).toBe(REPORT_REQUEST_STATUSES.ERROR);
    });

    it('holds a request for the generic survey export to permission to read its survey', async () => {
      const version = await models.ReportDefinitionVersion.findOne({
        where: { reportDefinitionId: GENERIC_SURVEY_EXPORT_REPORT_ID },
      });
      const surveyId = fakeUUID();
      const exporter = await makeUserWithPermissions([
        ['run', 'ReportDefinition', GENERIC_SURVEY_EXPORT_REPORT_ID],
      ]);
      const exporterWithSurvey = await makeUserWithPermissions([
        ['run', 'ReportDefinition', GENERIC_SURVEY_EXPORT_REPORT_ID],
        ['read', 'Survey', surveyId],
      ]);
      const request = overrides =>
        reportRequest({
          reportDefinitionVersionId: version.id,
          parameters: JSON.stringify({ surveyId }),
          ...overrides,
        });

      expect((await pushAndRead(request({ requestedByUserId: exporter.id }))).status).toBe(
        REPORT_REQUEST_STATUSES.ERROR,
      );
      expect(
        (await pushAndRead(request({ requestedByUserId: exporterWithSurvey.id }))).status,
      ).toBe(REPORT_REQUEST_STATUSES.RECEIVED);
    });

    it('checks each request in a batch on its own', async () => {
      const allowed = reportRequest();
      const denied = reportRequest({ requestedByUserId: unpermittedUser.id });
      await saveChangesForModel(
        models.ReportRequest,
        [allowed, denied].map(data => ({ data, isDeleted: false })),
        true,
        log,
      );

      expect((await models.ReportRequest.findByPk(allowed.id)).status).toBe(
        REPORT_REQUEST_STATUSES.RECEIVED,
      );
      expect((await models.ReportRequest.findByPk(denied.id)).status).toBe(
        REPORT_REQUEST_STATUSES.ERROR,
      );
    });
  });
});
