import { MODELS_ARRAY } from "~/models/modelsMap";

// Create a models repository map bound to a transactional entity manager
export function createTransactionalModelsMap(entityManager: any) {
  const transactionalModels = {};

  for (const model of MODELS_ARRAY) {
    transactionalModels[model.getTableName()] = entityManager.getRepository(model);
  }
  
  console.log(Object.keys(transactionalModels));
  return transactionalModels;
}