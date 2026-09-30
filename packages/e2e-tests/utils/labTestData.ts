/**
 * Lab reference data the lab request specs order against.
 *
 * These names mirror `packages/central-server/app/subCommands/defaultProvisioningData`
 * (the Lab Test Categories / Lab Test Panel / Lab Test Type sheets), which is what the
 * e2e environment is provisioned from. Every selector match is a substring match, so a
 * distinctive fragment of the name is enough — but the values still have to exist. If a
 * spec starts failing at `selectPanel` / `selectIndividualTest`, check here first.
 *
 * Two properties of the provisioned data the specs depend on:
 *  - Only Biochemistry and Coagulation hold individually orderable test types; the rest
 *    are `panelOnly`. `INDIVIDUAL_TESTS` deliberately spans both so a submission produces
 *    one lab request per category.
 *  - Every orderable test type carries a unit, so `SINGLE_TEST_UNIT` is asserted rather
 *    than a "n/a" fallback.
 */
export const labTestData = {
  /** A small panel, all of whose members are orderable on their own. */
  panel: 'Hemodialysis Post',
  /** Members of `panel`, in reference-data order. Asserted as a subset, not exhaustively. */
  panelMembers: ['Creatinine | 82565', 'BUN | 84520', 'Potassium | 84132'],

  /**
   * Two individually orderable tests in *different* categories, so ordering both creates
   * two lab requests. Index 0 is the Coagulation one, so pairing it with `panel`
   * (Biochemistry) also spans two categories.
   */
  individualTests: ['APTT | 85730', 'Albumin | 82040'],

  /** One individually orderable test, for journeys that want a single lab request. */
  singleTest: 'Albumin | 82040',
  /** `singleTest`'s unit, as shown in the results table. */
  singleTestUnit: 'g/dL',
};
