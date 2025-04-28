import { FhirReference } from '../../../src/services/fhirTypes';

class FakeFhirResourceModel {
  get fhirName() {
    return 'FakeFhirResource';
  }

  constructor() {
    this.resources = [];
  }

  add(resource) {
    this.resources.push(resource);
  }

  clear() {
    this.resources = [];
  }

  async findOne({ where }) {
    const { upstreamId } = where;
    if (!upstreamId) {
      throw new Error(`Must provide an upstreamId in the where clause of findOne`);
    }

    return this.resources.find((resource) => resource.upstreamId === upstreamId);
  }
}

const resourceModel = new FakeFhirResourceModel();
describe('FhirReference', () => {
  beforeEach(() => {
    resourceModel.clear();
  });

  describe('to', () => {
    it('should return a resolved reference if that resource exists', async () => {
      resourceModel.add({ upstreamId: '1234', id: '5678', resolved: true });

      const reference = await FhirReference.to(resourceModel, '1234', { display: 'Test' });
      expect(reference.reference).toBe('FakeFhirResource/5678');
      expect(reference.type).toBe('FakeFhirResource');
      expect(reference.display).toBe('Test');
    });

    it('should return an unresolved reference if that resource does not exist', async () => {
      const reference = await FhirReference.to(resourceModel, '1234', { display: 'Test' });
      expect(reference.reference).toBe('1234');
      expect(reference.type).toBe('upstream://fake_fhir_resource');
      expect(reference.display).toBe('Test');
    });

    it('should return an unresolved reference if that resource is not resolved', async () => {
      resourceModel.add({ upstreamId: '1234', id: '5678', resolved: false });

      const reference = await FhirReference.to(resourceModel, '1234', { display: 'Test' });
      expect(reference.reference).toBe('1234');
      expect(reference.type).toBe('upstream://fake_fhir_resource');
      expect(reference.display).toBe('Test');
    });

    it('should return an unresolved reference for a null/undefined upstreamId', async () => {
      const undefinedReference = await FhirReference.to(resourceModel, undefined, {
        display: 'Test',
      });
      expect(undefinedReference.reference).toBe(null);
      expect(undefinedReference.type).toBe('upstream://fake_fhir_resource');
      expect(undefinedReference.display).toBe('Test');

      const nullReference = await FhirReference.to(resourceModel, null, {
        display: 'Test',
      });
      expect(nullReference.reference).toBe(null);
      expect(nullReference.type).toBe('upstream://fake_fhir_resource');
      expect(nullReference.display).toBe('Test');
    });
  });
});
