import { EntityManager, Repository } from 'typeorm';
import { MODELS_MAP } from '~/models/modelsMap';

type ModelsRepositoryMap = {
  [K in keyof typeof MODELS_MAP]: Repository<InstanceType<typeof MODELS_MAP[K]>>
};

// Factory function to create a models map bound to a transactional entity manager
export function createTransactionalModelMap(entityManager: EntityManager): ModelsRepositoryMap {
  const transactionalModels = {} as ModelsRepositoryMap;

  for (const [modelName, ModelClass] of Object.entries(MODELS_MAP)) {
    transactionalModels[modelName] = 
      entityManager.getRepository(ModelClass) as Repository<InstanceType<typeof MODELS_MAP[typeof modelName]>>;
  }
  
  return transactionalModels;
}