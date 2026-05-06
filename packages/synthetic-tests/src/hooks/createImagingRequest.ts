import { IMAGING_TYPES } from '@tamanu/constants';

import { generateEncounterPayload } from './createEncounter';

async function createOpenEncounter(context: any): Promise<string> {
  const { api, facilityId } = context.vars;

  await generateEncounterPayload(context);

  const encounter = await api.post('encounter', {
    facilityId,
    ...context.vars.encounterPayload,
  });

  return encounter.id;
}

async function fetchFirstImagingAreaRecord(
  context: any,
  imagingType: string,
): Promise<{ id: string }> {
  const { api } = context.vars;
  const areasByType = await api.get('imagingRequest/areas');
  const areaRecords = areasByType[imagingType];
  if (!areaRecords?.length) {
    throw new Error(
      'No imaging areas in reference data for ctScan; skip the "with areas" scenario or seed imaging area reference data',
    );
  }
  return areaRecords[0];
}

/**
 * Creates an open encounter then builds a minimal POST /api/imagingRequest body.
 */
export async function generateImagingRequestPayload(context: any, _events: any): Promise<void> {
  const encounterId = await createOpenEncounter(context);

  context.vars.imagingRequestPayload = {
    encounterId,
    imagingType: IMAGING_TYPES.CT_SCAN,
    requestedById: context.vars.userId,
  };
}

/**
 * Same as {@link generateImagingRequestPayload}, plus areas (stringified JSON) and notes
 * to exercise ImagingRequestArea + note creation.
 */
export async function generateImagingRequestPayloadWithAreas(
  context: any,
  _events: any,
): Promise<void> {
  const encounterId = await createOpenEncounter(context);
  const imagingType = IMAGING_TYPES.CT_SCAN;

  const firstArea = await fetchFirstImagingAreaRecord(context, imagingType);

  context.vars.imagingRequestPayload = {
    encounterId,
    imagingType,
    requestedById: context.vars.userId,
    areas: JSON.stringify([firstArea.id]),
    areaNote: 'Synthetic test area note',
    note: 'Synthetic test note',
  };
}
