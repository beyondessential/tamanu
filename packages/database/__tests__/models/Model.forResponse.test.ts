import { describe, expect, it } from 'vitest';

import { Model } from '../../src/models/Model';

function callForResponse({
  dataValues,
  references,
}: {
  dataValues: Record<string, unknown>;
  references?: readonly string[];
}) {
  class TestModel extends Model {
    static getListReferenceAssociations() {
      return references;
    }
  }

  return Model.prototype.forResponse.call({
    dataValues,
    sequelize: { models: {} },
    constructor: TestModel,
  });
}

describe('Model.forResponse', () => {
  it.each([
    {
      description: 'strips null fields from dataValues',
      dataValues: { note: 'active', deletedAt: null },
      expected: { note: 'active' },
    },
    {
      description: 'returns dataValues unchanged when getListReferenceAssociations is undefined',
      dataValues: { note: 'active' },
      references: undefined,
      expected: { note: 'active' },
    },
    {
      description: 'transforms loaded associations into camelCase dataValues',
      dataValues: {
        Allergy: { dataValues: { id: 'allergy-1', name: 'Peanuts' } },
      },
      references: ['Allergy'],
      expected: {
        allergy: { id: 'allergy-1', name: 'Peanuts' },
      },
    },
    {
      description: 'transforms reference names from UpperCamelCase to camelCase',
      dataValues: {
        Patient: { dataValues: { id: 'patient-1' } },
        LabTest: { dataValues: { id: 'lab-test-1' } },
        LabTestType: { dataValues: { id: 'lab-test-type-1' } },
      },
      references: ['Patient', 'LabTest', 'LabTestType'],
      expected: {
        patient: { id: 'patient-1' },
        labTest: { id: 'lab-test-1' },
        labTestType: { id: 'lab-test-type-1' },
      },
    },
    {
      description: 'handles multiple references, transforming loaded ones and omitting falsy ones',
      dataValues: {
        Allergy: { dataValues: { id: 'allergy-1', name: 'Peanuts' } },
        Reaction: null,
        MissingAssociation: undefined,
      },
      references: ['Allergy', 'Reaction', 'MissingAssociation'],
      expected: {
        allergy: { id: 'allergy-1', name: 'Peanuts' },
      },
    },
  ])('$description', ({ dataValues, references, expected }) => {
    const id = crypto.randomUUID();
    const response = callForResponse({
      dataValues: { id, ...dataValues },
      references,
    });
    expect(response).toEqual({ id, ...expected });
  });
});
