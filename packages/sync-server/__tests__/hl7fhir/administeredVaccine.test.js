import { fake, fakeReferenceData, fakeUser } from '@tamanu/shared/test-helpers/fake';
import {
  administeredVaccineToHL7Immunization,
  getAdministeredVaccineInclude,
} from '../../app/hl7fhir/administeredVaccine';
import { createTestContext } from '../utilities';

import { validate } from './hl7utilities';

describe('HL7 Administered Vaccines', () => {
  let models;
  let ctx;

  let patientId;
  let administeredVaccineId;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    const {
      User,
      Facility,
      Department,
      Location,
      ReferenceData,
      Patient,
      Encounter,
      ScheduledVaccine,
      AdministeredVaccine,
    } = models;

    const patient = await Patient.create({ ...fake(Patient) });
    patientId = patient.id;

    const { id: examinerId } = await User.create(fakeUser());
    const { id: facilityId } = await Facility.create({ ...fake(Facility) });
    const { id: departmentId } = await Department.create({ ...fake(Department), facilityId });
    const { id: locationId } = await Location.create({ ...fake(Location), facilityId });
    const { id: encounterId } = await Encounter.create({
      ...fake(Encounter),
      departmentId,
      locationId,
      patientId,
      examinerId,
      endDate: null,
    });

    const EXPECTED_API_DRUG_ID = 'drug-COVAX';
    const { id: vaccineId } = await ReferenceData.create({
      ...fakeReferenceData(),
      id: EXPECTED_API_DRUG_ID,
      code: 'COVAX',
      type: 'drug',
      name: 'COVAX',
    });

    const { id: scheduledVaccineId } = await ScheduledVaccine.create({
      ...fake(ScheduledVaccine),
      vaccineId,
    });

    const administeredVaccine = await AdministeredVaccine.create({
      ...fake(AdministeredVaccine),
      status: 'GIVEN',
      date: new Date(),
      recorderId: examinerId,
      scheduledVaccineId,
      encounterId,
    });
    administeredVaccineId = administeredVaccine.id;
  });

  afterAll(() => ctx.close());

  it('Should produce a valid HL7 immunization', async () => {
    // Get vaccine and include everything needed
    const administeredVaccine = await models.AdministeredVaccine.findOne({
      where: { id: administeredVaccineId },
      include: [
        { association: 'recorder' },
        {
          association: 'scheduledVaccine',
          required: true,
          include: [
            {
              association: 'vaccine',
              required: true,
            },
          ],
        },
        {
          association: 'encounter',
          required: true,
          include: [
            {
              association: 'patient',
              required: true,
            },
          ],
        },
      ],
    });
    const hl7 = administeredVaccineToHL7Immunization(administeredVaccine);
    const { result, errors } = validate(hl7);
    expect(errors).toHaveLength(0);
    expect(result).toEqual(true);
  });

  it('Should output a valid sequelize include', async () => {
    const query = { patient: patientId, 'vaccine-code': 'COVAST' };
    const include = getAdministeredVaccineInclude(null, query);
    const administeredVaccine = await models.AdministeredVaccine.findAll({
      include,
    });
    expect(administeredVaccine.length).toBe(1);
  });
});
