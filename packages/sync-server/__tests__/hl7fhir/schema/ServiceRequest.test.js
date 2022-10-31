import { fake, showError } from 'shared/test-helpers';
import { createTestContext } from '../../utilities';

describe('ServiceRequest', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });
  afterAll(() => ctx.close());

  it('should create', () =>
    showError(async () => {
      // Arrange
      const { FhirPatient, FhirServiceRequest } = models;

      // Act
      const pa = await FhirPatient.create(fake(FhirPatient));
      const sr = await FhirServiceRequest.create({
        ...fake(FhirServiceRequest),
        subject: pa.id,
      });

      // Assert
      const srv = await FhirServiceRequest.findByPk(sr.id, {
        include: ['requesterPractitioner', 'subjectPatient'],
      });
      expect(srv.versionId).toBeTruthy();
      expect(srv.requesterPractitioner).toBeFalsy();
      expect(srv.subjectPatient.versionId).toEqual(pa.versionId);
    }));

  it('should update the version id on update', () =>
    showError(async () => {
      // Arrange
      const { FhirPatient, FhirServiceRequest } = models;

      const pa = await FhirPatient.create(fake(FhirPatient));
      const sr = await FhirServiceRequest.create({
        ...fake(FhirServiceRequest),
        subject: pa.id,
      });
      const { versionId } = sr;

      // Act
      await sr.update({ priority: 'routine' });
      await sr.reload();

      // Assert
      expect(sr.versionId).not.toEqual(versionId);
    }));

  it('should attach to a practitioner', () =>
    showError(async () => {
      // Arrange
      const { FhirPatient, FhirPractitioner, FhirServiceRequest } = models;

      // Act
      const pa = await FhirPatient.create(fake(FhirPatient));
      const pr = await FhirPractitioner.create(fake(FhirPractitioner));
      const sr = await FhirServiceRequest.create({
        ...fake(FhirServiceRequest),
        subject: pa.id,
        requester: pr.id,
      });

      await sr.reload();

      // Assert
      const srv = await FhirServiceRequest.findByPk(sr.id, {
        include: ['requesterPractitioner', 'subjectPatient'],
      });
      expect(srv.requesterPractitioner.versionId).toEqual(pr.versionId);
      expect(srv.subjectPatient.versionId).toEqual(pa.versionId);
    }));
});
