export async function createDiagnosis(models) {
  await models.ReferenceData.create({
    type: 'icd10',
    code: 'M79.7',
    id: 'icd10-M79-7',
    name: 'Myofibrosis',
  });
  await models.ReferenceData.create({
    type: 'icd10',
    code: 'S79.9',
    id: 'icd10-S79-9',
    name: 'Thigh injury',
  });
}

export async function createPatientFieldDefCategory(models) {
  await models.PatientFieldDefinitionCategory.create({
    id: '123',
    name: 'test 123',
  });
  await models.PatientFieldDefinitionCategory.create({
    id: '1234',
    name: 'test 1234',
  });
}

export async function createAllergy(models) {
  await models.ReferenceData.create({
    type: 'allergy',
    code: 'Sesame',
    id: 'allergy-Sesame',
    name: 'Sesame',
  });
  await models.ReferenceData.create({
    type: 'allergy',
    code: 'Wheat',
    id: 'allergy-Wheat',
    name: 'Wheat',
  });
}

export async function createPermission(models, { verb, noun, objectId, roleId }) {
  await models.Permission.create({
    verb,
    noun,
    objectId,
    roleId,
  });
}

export async function createRole(models, { id, name }) {
  await models.Role.create({
    id,
    name,
  });
}
