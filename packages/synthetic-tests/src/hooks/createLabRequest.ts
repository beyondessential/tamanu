import { generateEncounterPayload } from './createEncounter';

type LabTestTypeRow = {
  id: string;
  labTestCategoryId: string;
  isSensitive?: boolean;
};

type LabTestPanelRow = { id: string; name?: string };

type SuggestionRow = { id: string };

function nowRequestedDate(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function todayLabTestDate(): string {
  return new Date().toISOString().slice(0, 10);
}

async function openEncounterForLabRequest(
  context: any,
): Promise<{ encounterId: string; departmentId: string }> {
  const { api, facilityId } = context.vars;
  await generateEncounterPayload(context);
  const encounter = await api.post('encounter', {
    facilityId,
    ...context.vars.encounterPayload,
  });
  return {
    encounterId: encounter.id,
    departmentId: context.vars.encounterPayload.departmentId,
  };
}

function labRequestCommon(
  context: any,
  encounterId: string,
  departmentId: string,
): Record<string, unknown> {
  return {
    encounterId,
    departmentId,
    requestedById: context.vars.userId,
    requestedDate: nowRequestedDate(),
    labTest: { date: todayLabTestDate() },
  };
}

async function fetchLabTestTypes(context: any): Promise<LabTestTypeRow[]> {
  const { api, facilityId } = context.vars;
  const rows = (await api.get('labTestType', { facilityId })) as LabTestTypeRow[];
  return rows.filter(t => !t.isSensitive);
}

async function fetchLabPanels(context: any): Promise<LabTestPanelRow[]> {
  const { api, facilityId } = context.vars;
  return (await api.get('labTestPanel', { facilityId })) as LabTestPanelRow[];
}

async function fetchFirstSpecimenTypeId(context: any): Promise<string> {
  const { api } = context.vars;
  const rows = (await api.get('suggestions/specimenType', {
    noLimit: 'true',
  })) as SuggestionRow[];
  const first = rows[0];
  if (!first?.id) {
    throw new Error(
      'No specimen types in reference data; seed specimenType reference data or skip sample-collected lab scenarios',
    );
  }
  return first.id;
}

function pickTwoTypesSameCategory(types: LabTestTypeRow[]): [LabTestTypeRow, LabTestTypeRow] | null {
  const byCat = new Map<string, LabTestTypeRow[]>();
  for (const t of types) {
    const list = byCat.get(t.labTestCategoryId) ?? [];
    list.push(t);
    byCat.set(t.labTestCategoryId, list);
  }
  for (const [, list] of byCat) {
    if (list.length >= 2) {
      return [list[0], list[1]];
    }
  }
  return null;
}

function pickTwoTypesDifferentCategories(types: LabTestTypeRow[]): [LabTestTypeRow, LabTestTypeRow] | null {
  const byCat = new Map<string, LabTestTypeRow>();
  for (const t of types) {
    if (!byCat.has(t.labTestCategoryId)) {
      byCat.set(t.labTestCategoryId, t);
    }
    if (byCat.size >= 2) {
      const [a, b] = [...byCat.values()];
      return [a, b];
    }
  }
  return null;
}

/**
 * Individual request: one lab test type, sample not collected.
 */
export async function generateLabRequestPayloadIndividualSingle(
  context: any,
  _events: any,
): Promise<void> {
  const { encounterId, departmentId } = await openEncounterForLabRequest(context);
  const types = await fetchLabTestTypes(context);
  const first = types[0];
  if (!first) {
    throw new Error(
      'No non-sensitive lab test types for this facility; seed lab reference data or skip lab scenarios',
    );
  }

  context.vars.labRequestPayload = {
    ...labRequestCommon(context, encounterId, departmentId),
    labTestTypeIds: [first.id],
    panelIds: [],
  };
}

/**
 * Individual request: two tests in the same category → one lab_requests row, two lab_tests.
 */
export async function generateLabRequestPayloadIndividualTwoTestsSameCategory(
  context: any,
  _events: any,
): Promise<void> {
  const { encounterId, departmentId } = await openEncounterForLabRequest(context);
  const types = await fetchLabTestTypes(context);
  const pair = pickTwoTypesSameCategory(types);
  if (!pair) {
    throw new Error(
      'Need at least two lab test types in the same category for this scenario; add more seed lab types',
    );
  }

  context.vars.labRequestPayload = {
    ...labRequestCommon(context, encounterId, departmentId),
    labTestTypeIds: [pair[0].id, pair[1].id],
    panelIds: [],
  };
}

/**
 * Individual request: two tests in different categories → two lab_requests rows in one POST.
 */
export async function generateLabRequestPayloadIndividualTwoCategories(
  context: any,
  _events: any,
): Promise<void> {
  const { encounterId, departmentId } = await openEncounterForLabRequest(context);
  const types = await fetchLabTestTypes(context);
  const pair = pickTwoTypesDifferentCategories(types);
  if (!pair) {
    throw new Error(
      'Need lab test types in at least two different categories for this scenario; add seed data',
    );
  }

  context.vars.labRequestPayload = {
    ...labRequestCommon(context, encounterId, departmentId),
    labTestTypeIds: [pair[0].id, pair[1].id],
    panelIds: [],
  };
}

/**
 * Panel request: one panel → tests implied by panel; sample not collected.
 */
export async function generateLabRequestPayloadPanel(context: any, _events: any): Promise<void> {
  const { encounterId, departmentId } = await openEncounterForLabRequest(context);
  const panels = await fetchLabPanels(context);
  const panel = panels[0];
  if (!panel) {
    throw new Error(
      'No lab test panels for this facility; seed labTestPanel data or skip panel lab scenarios',
    );
  }

  context.vars.labRequestPayload = {
    ...labRequestCommon(context, encounterId, departmentId),
    panelIds: [panel.id],
    labTestTypeIds: [],
  };
}

/**
 * Panel request with sample collected (collection time + specimen type) → reception pending + specimen attached.
 */
export async function generateLabRequestPayloadPanelSampleCollected(
  context: any,
  _events: any,
): Promise<void> {
  const { encounterId, departmentId } = await openEncounterForLabRequest(context);
  const panels = await fetchLabPanels(context);
  const panel = panels[0];
  if (!panel) {
    throw new Error(
      'No lab test panels for this facility; seed labTestPanel data or skip panel lab scenarios',
    );
  }

  const specimenTypeId = await fetchFirstSpecimenTypeId(context);
  const sampleTime = nowRequestedDate();

  context.vars.labRequestPayload = {
    ...labRequestCommon(context, encounterId, departmentId),
    panelIds: [panel.id],
    labTestTypeIds: [],
    sampleDetails: {
      [panel.id]: {
        sampleTime,
        specimenTypeId,
        collectedById: context.vars.userId,
      },
    },
  };
}

/**
 * Individual single test with sample time + specimen + note.
 */
export async function generateLabRequestPayloadIndividualSampleAndNote(
  context: any,
  _events: any,
): Promise<void> {
  const { encounterId, departmentId } = await openEncounterForLabRequest(context);
  const types = await fetchLabTestTypes(context);
  const first = types[0];
  if (!first) {
    throw new Error(
      'No non-sensitive lab test types for this facility; seed lab reference data or skip lab scenarios',
    );
  }

  const specimenTypeId = await fetchFirstSpecimenTypeId(context);
  const sampleTime = nowRequestedDate();

  context.vars.labRequestPayload = {
    ...labRequestCommon(context, encounterId, departmentId),
    labTestTypeIds: [first.id],
    panelIds: [],
    sampleDetails: {
      [first.labTestCategoryId]: {
        sampleTime,
        specimenTypeId,
        collectedById: context.vars.userId,
      },
    },
    note: {
      date: sampleTime,
      content: 'Synthetic lab request note',
    },
  };
}
