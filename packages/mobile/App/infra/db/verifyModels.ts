import { BaseModel } from '~/models/BaseModel';

const verifyModelHasRelationIdPerManyToOneRelation = (model: typeof BaseModel): string[] => {
  const { relationIds, manyToOneRelations } = model.getRepository().metadata;
  const relationIdsIndex = relationIds.reduce((memo, relationId) => ({
    ...memo,
    [relationId.propertyName]: relationId,
  }), {});
  return manyToOneRelations.map(relation => {
    if (!relationIdsIndex[relation.propertyPath]) {
      return `many-to-one relation "${relation.propertyPath}" needs a corresponding @RelationId property`;
    }
  });
}

const verifyModel = (model: typeof BaseModel): string[] | null => {
  return [
    ...verifyModelHasRelationIdPerManyToOneRelation(model),
  ];
}

export const verifyModels = (models: typeof BaseModel[]) => {
  const messages = models.map(model => {
    const modelMessages = verifyModel(model).filter(m => m !== null);
    if (modelMessages.length > 0) {
      return [`  ${model.name}:`, ...modelMessages].join('\n    ');
    }
    return null;
  }).filter(m => m !== null);
  if (messages.length > 0) {
    throw new Error(`Model verification failed:\n${messages.join('\n')}`);
  }
};
