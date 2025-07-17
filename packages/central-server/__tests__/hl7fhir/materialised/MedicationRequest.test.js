import { formatRFC7231 } from 'date-fns';
import { fake, fakeReferenceData } from '@tamanu/fake-data/fake';
import { createTestContext } from '../../utilities';
import { ADMINISTRATION_FREQUENCIES, DRUG_ROUTES, DRUG_UNITS } from '@tamanu/constants';
import { formatFhirDate } from '@tamanu/shared/utils/fhir/datetime';

const INTEGRATION_ROUTE = 'fhir/mat';

describe(`Materialised FHIR - MedicationRequest`, () => {
  let ctx;
  let app;
  let resources;

  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');

    const {
      Facility,
      Location,
      Department,
      Patient,
      ReferenceData,
      User,
      Encounter,
      FhirPatient,
      FhirOrganization,
      FhirPractitioner,
      FhirEncounter,
    } = ctx.store.models;

    const [practitioner, patient, drug1, drug2, facility] = await Promise.all([
      User.create(fake(User)),
      Patient.create(fake(Patient)),
      ReferenceData.create({ ...fakeReferenceData(), type: 'drug' }),
      ReferenceData.create({ ...fakeReferenceData(), type: 'drug' }),
      Facility.create(fake(Facility)),
    ]);

    const department = await Department.create({ ...fake(Department), facilityId: facility.id });
    const location = await Location.create({
      ...fake(Location),
      facilityId: facility.id,
      departmentId: department.id,
    });
    const encounter = await Encounter.create({
      ...fake(Encounter),
      patientId: patient.id,
      locationId: location.id,
      departmentId: department.id,
      examinerId: practitioner.id,
    });

    const [fhirPatient, fhirEncounter, fhirOrganization, fhirPractitioner] = await Promise.all([
      FhirPatient.materialiseFromUpstream(patient.id),
      FhirEncounter.materialiseFromUpstream(encounter.id),
      FhirOrganization.materialiseFromUpstream(facility.id),
      FhirPractitioner.materialiseFromUpstream(practitioner.id),
    ]);

    await FhirEncounter.resolveUpstreams();

    resources = {
      practitioner,
      patient,
      drug1,
      drug2,
      facility,
      location,
      encounter,
      fhirPatient,
      fhirEncounter,
      fhirOrganization,
      fhirPractitioner,
    };
  });

  afterAll(async () => {
    const {
      Facility,
      Location,
      Patient,
      ReferenceData,
      User,
      Encounter,
      FhirPatient,
      FhirOrganization,
      FhirPractitioner,
      FhirEncounter,
    } = ctx.store.models;
    await Facility.destroy({ where: {} });
    await Location.destroy({ where: {} });
    await Patient.destroy({ where: {} });
    await ReferenceData.destroy({ where: {} });
    await User.destroy({ where: {} });
    await Encounter.destroy({ where: {} });
    await FhirPatient.destroy({ where: {} });
    await FhirOrganization.destroy({ where: {} });
    await FhirPractitioner.destroy({ where: {} });
    await FhirEncounter.destroy({ where: {} });
    await ctx.close();
  });

  describe('materialise', () => {
    beforeEach(async () => {
      const { FhirMedicationRequest, PharmacyOrder, PharmacyOrderPrescription } = ctx.store.models;
      await FhirMedicationRequest.destroy({ where: {} });
      await PharmacyOrder.destroy({ where: {} });
      await PharmacyOrderPrescription.destroy({ where: {} });
    });

    it('Materialises a medication request from a PharmacyOrderPrescription', async () => {
      // arrange
      const { FhirMedicationRequest, PharmacyOrder, PharmacyOrderPrescription, Prescription } =
        ctx.store.models;

      const prescription = await Prescription.create(
        fake(Prescription, {
          medicationId: resources.drug1.id,
          doseAmount: 10,
          units: DRUG_UNITS.mg,
          frequency: ADMINISTRATION_FREQUENCIES.DAILY,
          idealTimes: ['11:00'],
          route: DRUG_ROUTES.oral,
          prescriberId: resources.practitioner.id,
          isVariableDose: false,
        }),
      );
      const pharmacyOrder = await PharmacyOrder.create(
        fake(PharmacyOrder, {
          encounterId: resources.encounter.id,
          orderingClinicianId: resources.practitioner.id,
          comments: 'Test comments',
        }),
      );
      const pharmacyOrderPrescription = await PharmacyOrderPrescription.create(
        fake(PharmacyOrderPrescription, {
          pharmacyOrderId: pharmacyOrder.id,
          prescriptionId: prescription.id,
          quantity: 10,
          repeats: 3,
        }),
      );

      const mat = await FhirMedicationRequest.materialiseFromUpstream(pharmacyOrderPrescription.id);

      const path = `/api/integration/${INTEGRATION_ROUTE}/MedicationRequest/${mat.id}`;

      // act
      const response = await app.get(path);

      // assert
      expect(response.body).toMatchObject({
        resourceType: 'MedicationRequest',
        id: expect.any(String),
        meta: {
          lastUpdated: formatFhirDate(mat.lastUpdated),
        },
        identifier: [
          {
            system: 'http://data-dictionary.tamanu.org/tamanu-mrid-pharmacyorderprescription.html',
            value: pharmacyOrderPrescription.id,
          },
        ],
        groupIdentifier: [
          {
            system: 'http://data-dictionary.tamanu.org/tamanu-mrid-pharmacyorder.html',
            value: pharmacyOrder.id,
          },
        ],
        status: 'active',
        intent: 'order',
        subject: {
          reference: `Patient/${resources.fhirPatient.id}`,
          type: 'Patient',
          display: `${resources.patient.firstName} ${resources.patient.lastName}`,
        },
        encounter: {
          reference: `Encounter/${resources.fhirEncounter.id}`,
          type: 'Encounter',
        },
        requester: {
          type: 'Organization',
          reference: `Organization/${resources.fhirOrganization.id}`,
          display: resources.fhirOrganization.name,
        },
        recorder: {
          type: 'Practitioner',
          reference: `Practitioner/${resources.fhirPractitioner.id}`,
          display: resources.fhirPractitioner.name[0].text,
        },
        medication: {
          coding: [
            {
              code: resources.drug1.code,
              display: resources.drug1.name,
              system: 'http://data-dictionary.tamanu.org/tamanu-msupplyuniveralcodes.html',
            },
          ],
        },
        dosageInstruction: {
          text: '10 mg - Daily',
          route: {
            coding: [
              {
                code: prescription.route,
                system: 'http://data-dictionary.tamanu.org/tamanu-medicationroutecodes.html',
              },
            ],
          },
          timing: {
            repeat: {
              frequency: 1,
              period: 1,
              periodUnit: 'd',
              timeOfDay: prescription.idealTimes.map(time => time.concat(':00')),
            },
          },
          doseAndRate: [
            {
              type: {
                coding: [
                  {
                    code: 'ordered',
                    system: 'https://hl7.org/fhir/R4B/codesystem-dose-rate-type.html',
                  },
                ],
              },
              dose: {
                doseQuantity: {
                  value: parseInt(prescription.doseAmount),
                  unit: prescription.units,
                },
              },
            },
          ],
        },
        authoredOn: pharmacyOrder.createdAt.toISOString(),
        note: [
          {
            text: pharmacyOrder.comments,
          },
        ],
      });
      expect(response.headers['last-modified']).toBe(formatRFC7231(new Date(mat.lastUpdated)));
      expect(response).toHaveSucceeded();
    });
  });
});
