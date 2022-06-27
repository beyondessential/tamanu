import { MODELS_ARRAY } from './modelsMap';
import { BaseModel } from './BaseModel';

describe('findMarkedForUpload', () => {
  describe('is overridden on models that implement markPatient', () => {
    MODELS_ARRAY
      .filter((m: any) => (new m()).markPatient !== undefined)
      .forEach(m => {
        it(`is overridden on ${m.name}`, () => {
          expect(m.findMarkedForUpload).not.toEqual(BaseModel.findMarkedForUpload);
        });
      });
  });
});
