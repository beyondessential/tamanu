import { Database } from '~/infra/db';
import { BaseModel } from '~/models/BaseModel';
import { MODELS_ARRAY, MODELS_MAP } from '~/models/modelsMap';

const verifyModelHasIdsForRelations = (model: typeof BaseModel): string[] => {
  const { relationIds, columns, manyToOneRelations, oneToOneRelations } = model.getRepository().metadata;

  const columnsIndex = columns.reduce((memo, column) => ({
    ...memo,
    [column.propertyName]: column,
  }), {});

  const relationIdsIndex = relationIds.reduce((memo, relationId) => ({
    ...memo,
    [relationId.propertyName]: relationId,
  }), {});

  return [
    ...manyToOneRelations.map(relation => {
      const idPath = `${relation.propertyPath}Id`;
      if (!relationIdsIndex[idPath] && !columnsIndex[idPath]) {
        return `many-to-one relation "${relation.propertyPath}" needs a corresponding @RelationId()/@IdRelation()/@Column definition and a "${idPath}: string;" property`;
      }
    }),
    ...oneToOneRelations.map(relation => {
      const idPath = `${relation.propertyPath}Id`;
      if (relation.isOneToOneOwner && !relationIdsIndex[idPath] && !columnsIndex[idPath]) {
        return `one-to-one relation "${relation.propertyPath}" needs a corresponding @RelationId()/@IdRelation()/@Column definition and a "${idPath}: string;" property`;
      }
    }),
  ];
}

const verifyModel = (model: typeof BaseModel): string[] | null => {
  return [
    ...verifyModelHasIdsForRelations(model),
  ];
}

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveRelationIdsForApplicableRelations(): R,
    }
  }
}

expect.extend({
  toHaveRelationIdsForApplicableRelations(model: typeof BaseModel) {
    const modelMessages = verifyModel(model).filter(m => m);
    if (modelMessages.length > 0) {
      return {
        message: () => modelMessages.join('\n'),
        pass: false,
      };
    } else {
      return {
        message: () => `${model.name}: <all fields passed>`,
        pass: true,
      };
    }
  }
});

beforeAll(async () => {
  await Database.connect();
});

MODELS_ARRAY.forEach(model => {
  describe(model.name, () => {
    it('has relationIds for all OneToOne and ManyToOne relations', () => {
      expect(model).toHaveRelationIdsForApplicableRelations();
    });
  });
});
