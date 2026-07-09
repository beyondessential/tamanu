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
  it('strips null fields from dataValues', () => {
    const id = crypto.randomUUID();
    const response = callForResponse({
      dataValues: {
        id,
        note: 'active',
        deletedAt: null,
      },
    });
    expect(response).toEqual({
      id,
      note: 'active',
    });
  });

  it('returns dataValues unchanged when getListReferenceAssociations is undefined', () => {
    const id = crypto.randomUUID();
    const response = callForResponse({
      dataValues: {
        id,
        note: 'active',
      },
      references: undefined,
    });
    expect(response).toEqual({
      id,
      note: 'active',
    });
  });

  it('transforms loaded associations into camelCase dataValues', () => {
    const id = crypto.randomUUID();
    const response = callForResponse({
      dataValues: {
        id,
        Allergy: { dataValues: { id: 'allergy-1', name: 'Peanuts' } },
      },
      references: ['Allergy'],
    });
    expect(response).toEqual({
      id,
      allergy: { id: 'allergy-1', name: 'Peanuts' },
    });
  });

  it('transforms reference names from UpperCamelCase to camelCase', () => {
    const id = crypto.randomUUID();
    const response = callForResponse({
      dataValues: {
        id,
        Patient: { dataValues: { id: 'patient-1' } },
        LabTest: { dataValues: { id: 'lab-test-1' } },
        LabTestType: { dataValues: { id: 'lab-test-type-1' } },
      },
      references: ['Patient', 'LabTest', 'LabTestType'],
    });
    expect(response).toEqual({
      id,
      patient: { id: 'patient-1' },
      labTest: { id: 'lab-test-1' },
      labTestType: { id: 'lab-test-type-1' },
    });
  });

  it('handles multiple references, transforming loaded ones and omitting falsy ones', () => {
    const id = crypto.randomUUID();
    const response = callForResponse({
      dataValues: {
        id,
        Allergy: { dataValues: { id: 'allergy-1', name: 'Peanuts' } },
        Reaction: null,
        MissingAssociation: undefined,
      },
      references: ['Allergy', 'Reaction', 'MissingAssociation'],
    });
    expect(response).toEqual({
      id,
      allergy: { id: 'allergy-1', name: 'Peanuts' },
    });
  });
});
