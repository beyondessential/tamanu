import { describe, expect, it } from 'vitest';
import { prepareDietSummary } from './prepareDietSummary';

// Mirrors the PDF language context: a seeded translation wins, otherwise the fallback shows.
const makeGetTranslation = (translations = {}) => (stringId, fallback) =>
  translations[stringId] ?? fallback;

const labelsOf = (columns) => columns.map(({ label }) => label);
const wardNamesOf = (sections) => sections.map(({ wardName }) => wardName);

describe('prepareDietSummary', () => {
  describe('diet columns', () => {
    it('leads with the regular column whatever its name sorts as', () => {
      const { dietColumns } = prepareDietSummary({
        columns: [
          { key: 'soft', name: 'Soft', isRegular: false },
          { key: 'zzz-diet', name: 'Zzz regular meal', isRegular: true },
          { key: 'diabetic', name: 'Diabetic', isRegular: false },
        ],
        getTranslation: makeGetTranslation(),
      });

      expect(labelsOf(dietColumns)).toEqual(['Zzz regular meal', 'Diabetic', 'Soft']);
    });

    it('labels the regular column Regular where the configured diet has no name', () => {
      const { dietColumns } = prepareDietSummary({
        columns: [{ key: 'regular', name: null, isRegular: true }],
        getTranslation: makeGetTranslation(),
      });

      expect(labelsOf(dietColumns)).toEqual(['Regular']);
    });

    it('does not label a nameless non-regular column Regular', () => {
      const { dietColumns } = prepareDietSummary({
        columns: [
          { key: 'regular', name: null, isRegular: true },
          { key: 'diet-with-no-name', name: null, isRegular: false },
        ],
        getTranslation: makeGetTranslation(),
      });

      expect(labelsOf(dietColumns)).toEqual(['Regular', 'Unknown diet']);
    });

    it('orders the non-regular columns by the label the sheet prints, not the name it was given', () => {
      const { dietColumns } = prepareDietSummary({
        columns: [
          { key: 'regular', name: null, isRegular: true },
          { key: 'apple-diet', name: 'Apple diet', isRegular: false },
          { key: 'banana-diet', name: 'Banana diet', isRegular: false },
        ],
        // The translation reverses the source-language order of the two named diets.
        getTranslation: makeGetTranslation({ 'refData.diet.apple-diet': 'Zucchini diet' }),
      });

      expect(labelsOf(dietColumns)).toEqual(['Regular', 'Banana diet', 'Zucchini diet']);
    });

    it('resolves a diet name through its reference data translation', () => {
      const { dietColumns } = prepareDietSummary({
        columns: [{ key: 'soft', name: 'Soft', isRegular: false }],
        getTranslation: makeGetTranslation({ 'refData.diet.soft': 'Kall' }),
      });

      expect(dietColumns).toEqual([{ key: 'soft', label: 'Kall', isRegular: false }]);
    });
  });

  describe('ward sections', () => {
    it('orders the named wards alphabetically and sorts No area last', () => {
      const { wardSections } = prepareDietSummary({
        areas: [
          { id: null, name: null, patients: [] },
          { id: 'ward-b', name: 'Beta Ward', patients: [] },
          { id: 'ward-a', name: 'Alpha Ward', patients: [] },
        ],
        getTranslation: makeGetTranslation(),
      });

      expect(wardNamesOf(wardSections)).toEqual(['Alpha Ward', 'Beta Ward', 'No area']);
    });

    it('keeps No area last even where its label sorts before the wards', () => {
      const { wardSections } = prepareDietSummary({
        areas: [
          { id: null, name: null, patients: [] },
          { id: 'ward-a', name: 'Alpha Ward', patients: [] },
        ],
        getTranslation: makeGetTranslation({ 'pdf.dietSummary.noArea': 'Aaa no area' }),
      });

      expect(wardNamesOf(wardSections)).toEqual(['Alpha Ward', 'Aaa no area']);
    });

    it('orders the wards by the name the sheet prints, not the name it was given', () => {
      const { wardSections } = prepareDietSummary({
        areas: [
          { id: 'ward-a', name: 'Alpha Ward', patients: [] },
          { id: 'ward-b', name: 'Beta Ward', patients: [] },
        ],
        // The translation reverses the source-language order of the two wards.
        getTranslation: makeGetTranslation({ 'refData.locationGroup.ward-a': 'Zulu Ward' }),
      });

      expect(wardNamesOf(wardSections)).toEqual(['Beta Ward', 'Zulu Ward']);
    });

    it('carries each area through untouched beside its resolved name', () => {
      const area = {
        id: 'ward-a',
        name: 'Alpha Ward',
        subTotals: { regular: 1 },
        patients: [{ encounterId: 'enc-1' }],
      };
      const { wardSections } = prepareDietSummary({
        areas: [area],
        getTranslation: makeGetTranslation(),
      });

      expect(wardSections).toEqual([{ area, wardName: 'Alpha Ward' }]);
    });
  });

  it('returns nothing to print for an empty sheet', () => {
    expect(prepareDietSummary({ getTranslation: makeGetTranslation() })).toEqual({
      dietColumns: [],
      wardSections: [],
    });
  });
});
