import { fake, fakeReferenceData } from 'shared/test-helpers';

export const fakeResourcesOfFhirServiceRequest = async models => {
  const {
    Department,
    Encounter,
    Facility,
    ImagingAreaExternalCode,
    Location,
    LocationGroup,
    Patient,
    ReferenceData,
    User,
    FhirPatient,
  } = models;

  const [practitioner, patient, area1, area2, facility] = await Promise.all([
    User.create(fake(User)),
    Patient.create(fake(Patient)),
    ReferenceData.create({ ...fakeReferenceData('xRay'), type: 'xRayImagingArea' }),
    ReferenceData.create({ ...fakeReferenceData('xRay'), type: 'xRayImagingArea' }),
    Facility.create(fake(Facility)),
  ]);

  const [extCode1, extCode2, fhirPatient, locationGroup] = await Promise.all([
    ImagingAreaExternalCode.create(fake(ImagingAreaExternalCode, { areaId: area1.id })),
    ImagingAreaExternalCode.create(fake(ImagingAreaExternalCode, { areaId: area2.id })),
    FhirPatient.materialiseFromUpstream(patient.id),
    LocationGroup.create(fake(LocationGroup, { facilityId: facility.id })),
  ]);

  const location = await Location.create(
    fake(Location, { facilityId: facility.id, locationGroupId: locationGroup.id }),
  );
  const department = await Department.create(
    fake(Department, { locationId: location.id, facilityId: facility.id }),
  );

  const encounter = await Encounter.create(
    fake(Encounter, {
      patientId: patient.id,
      locationId: location.id,
      departmentId: department.id,
      examinerId: practitioner.id,
      encounterType: 'surveyResponse',
    }),
  );

  const resources = {
    encounter,
    practitioner,
    patient,
    area1,
    area2,
    facility,
    location,
    department,
    extCode1,
    extCode2,
    fhirPatient,
    locationGroup,
  };

  return resources;
};
