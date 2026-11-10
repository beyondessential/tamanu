/**
 * POST /api/patient/checkDuplicates — same shape as the new-patient form (demographics + displayId).
 * The DB duplicate finder matches on name + DOB; displayId is included to mirror registration UX.
 *
 * By default, ~half of runs reuse a real patient's details (likely duplicates) and half use synthetic
 * values (unlikely to match). Override with `syntheticCheckDuplicatesMatchProbability` in context.vars
 * (0–1, e.g. 1 = always match, 0 = never match).
 */
function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function preparePatientCheckDuplicatesPayload(context: any, _events: any): Promise<void> {
  const { entityFetcher } = context.vars;
  const rawProb = context.vars.syntheticCheckDuplicatesMatchProbability;
  const matchProbability =
    typeof rawProb === 'number' && rawProb >= 0 && rawProb <= 1 ? rawProb : 0.5;
  const existing = await entityFetcher.getRandom('patient');

  const firstName = existing?.firstName;
  const lastName = existing?.lastName;
  const dateOfBirth = existing?.dateOfBirth;
  const displayId = existing?.displayId;

  // The create-patient scenario leaves some of these empty, and such a patient can't be matched.
  const canMatchExisting = Boolean(firstName?.trim() && lastName?.trim() && dateOfBirth && displayId);
  const seekLikelyDuplicate = canMatchExisting && Math.random() < matchProbability;

  const sex = existing.sex ?? 'other';

  const patientCheckDuplicatesPayload = seekLikelyDuplicate
    ? {
        firstName,
        lastName,
        dateOfBirth,
        displayId,
        sex,
      }
    : {
        firstName: `Synthetic${randomSuffix()}`,
        lastName: `NoMatch${randomSuffix()}`,
        dateOfBirth: '1990-06-15',
        displayId: `syn-nodup-${randomSuffix()}`,
        sex,
      };

  context.vars = {
    ...context.vars,
    patientCheckDuplicatesPayload,
  };
}
