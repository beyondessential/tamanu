import { describe, it, expect } from 'vitest';

import {
  buildDischargeNote,
  buildMedicationsInitialValues,
  toDischargeDraftPayload,
} from '../../app/forms/dischargeDraft';

const note = (id, content) => ({ id, content });

describe('buildDischargeNote', () => {
  it('seeds from the discharge planning notes when there is no draft', () => {
    const dischargeNotes = [note('a', 'first'), note('b', 'second')];

    expect(buildDischargeNote({ draft: null, dischargeNotes })).toEqual('first\n\nsecond');
  });

  it('is empty when there is neither a draft nor any planning note', () => {
    expect(buildDischargeNote({ draft: null, dischargeNotes: [] })).toEqual('');
    expect(buildDischargeNote({ draft: null, dischargeNotes: undefined })).toEqual('');
  });

  it('restores what the clinician typed rather than reseeding from the notes', () => {
    const dischargeNotes = [note('a', 'first')];
    const draft = { note: 'my edited plan', seededNoteIds: ['a'] };

    expect(buildDischargeNote({ draft, dischargeNotes })).toEqual('my edited plan');
  });

  it('appends planning notes written since the draft was saved', () => {
    const dischargeNotes = [note('a', 'first'), note('b', 'added by a colleague')];
    const draft = { note: 'my edited plan', seededNoteIds: ['a'] };

    expect(buildDischargeNote({ draft, dischargeNotes })).toEqual(
      'my edited plan\n\nadded by a colleague',
    );
  });

  it('identifies absorbed notes by id, so an edited note is not appended twice', () => {
    // The clinician reworded the seeded note inside the draft, and the planning note itself was
    // later edited. It is still the same note, so it must not reappear.
    const dischargeNotes = [note('a', 'first, since edited')];
    const draft = { note: 'my rewording', seededNoteIds: ['a'] };

    expect(buildDischargeNote({ draft, dischargeNotes })).toEqual('my rewording');
  });

  it('keeps a new planning note when the clinician had cleared the note field', () => {
    const dischargeNotes = [note('a', 'first'), note('b', 'new one')];
    const draft = { note: '', seededNoteIds: ['a'] };

    expect(buildDischargeNote({ draft, dischargeNotes })).toEqual('new one');
  });

  it('treats a draft with no seed set as having absorbed nothing', () => {
    const dischargeNotes = [note('a', 'first')];
    const draft = { note: 'typed' };

    expect(buildDischargeNote({ draft, dischargeNotes })).toEqual('typed\n\nfirst');
  });
});

describe('toDischargeDraftPayload', () => {
  const values = {
    endDate: '2026-08-13 09:00:00',
    discharge: { dischargerId: 'user-1', dispositionId: 'disposition-1', note: 'plan' },
    pharmacyOrder: { orderingClinicianId: 'user-2' },
    medications: {
      'prescription-1': { quantity: 3, repeats: '2', sendToPharmacy: true },
    },
  };

  it('records the whole current note set as absorbed', () => {
    const payload = toDischargeDraftPayload({
      values,
      dischargeNotes: [note('a', 'first'), note('b', 'second')],
      isPharmacyOrderEnabled: true,
    });

    expect(payload.seededNoteIds).toEqual(['a', 'b']);
    expect(payload.note).toEqual('plan');
  });

  it('sends medication lines keyed by prescription with repeats as a number', () => {
    const payload = toDischargeDraftPayload({
      values,
      dischargeNotes: [],
      isPharmacyOrderEnabled: true,
    });

    expect(payload.medications).toEqual([
      { prescriptionId: 'prescription-1', quantity: 3, repeats: 2, sendToPharmacy: true },
    ]);
  });

  it('keeps a cleared quantity or repeats null rather than coercing to zero', () => {
    const payload = toDischargeDraftPayload({
      values: {
        ...values,
        medications: { 'prescription-1': { quantity: null, repeats: '', sendToPharmacy: false } },
      },
      dischargeNotes: [],
      isPharmacyOrderEnabled: true,
    });

    expect(payload.medications).toEqual([
      { prescriptionId: 'prescription-1', quantity: null, repeats: null, sendToPharmacy: false },
    ]);
  });

  it('omits the ordering clinician when pharmacy orders are not enabled', () => {
    const payload = toDischargeDraftPayload({
      values,
      dischargeNotes: [],
      isPharmacyOrderEnabled: false,
    });

    expect(payload.orderingClinicianId).toBeUndefined();
  });
});

describe('buildMedicationsInitialValues', () => {
  const prescribed = { id: 'prescription-1', quantity: 5, repeats: 3 };

  const build = draft =>
    buildMedicationsInitialValues({
      encounterMedications: [prescribed],
      ongoingMedications: [],
      draft,
      isPharmacyOrderEnabled: true,
    });

  it('takes the live prescription values when there is no draft', () => {
    expect(build(null)['prescription-1']).toEqual({
      quantity: 5,
      repeats: '3',
      sendToPharmacy: true,
    });
  });

  it('leaves quantity blank rather than zeroed when the prescription has none', () => {
    const values = buildMedicationsInitialValues({
      encounterMedications: [{ id: 'prescription-1' }],
      ongoingMedications: [],
      draft: null,
      isPharmacyOrderEnabled: false,
    });

    expect(values['prescription-1']).toEqual({
      quantity: null,
      repeats: '0',
      sendToPharmacy: false,
    });
  });

  it('restores a saved line over the live prescription values', () => {
    const draft = {
      medications: [
        { prescriptionId: 'prescription-1', quantity: 1, repeats: 0, sendToPharmacy: false },
      ],
    };

    expect(build(draft)['prescription-1']).toEqual({
      quantity: 1,
      repeats: '0',
      sendToPharmacy: false,
    });
  });

  it('keeps a deliberately cleared quantity and repeats cleared', () => {
    const draft = {
      medications: [
        { prescriptionId: 'prescription-1', quantity: null, repeats: null, sendToPharmacy: true },
      ],
    };

    // Falling back to the prescription here would silently undo the clinician clearing the field.
    expect(build(draft)['prescription-1']).toEqual({
      quantity: null,
      repeats: '',
      sendToPharmacy: true,
    });
  });

  it('takes live defaults for a medication added since the draft was saved', () => {
    const draft = {
      medications: [
        { prescriptionId: 'prescription-1', quantity: 1, repeats: 1, sendToPharmacy: false },
      ],
    };
    const values = buildMedicationsInitialValues({
      encounterMedications: [prescribed, { id: 'prescription-2', quantity: 9, repeats: 2 }],
      ongoingMedications: [],
      draft,
      isPharmacyOrderEnabled: true,
    });

    expect(values['prescription-2']).toEqual({
      quantity: 9,
      repeats: '2',
      sendToPharmacy: true,
    });
  });

  it("defaults the patient's other ongoing medications to not being sent to pharmacy", () => {
    const values = buildMedicationsInitialValues({
      encounterMedications: [],
      ongoingMedications: [prescribed],
      draft: null,
      isPharmacyOrderEnabled: true,
    });

    expect(values['prescription-1'].sendToPharmacy).toBe(false);
  });
});

describe('discharge draft medication round trip', () => {
  const roundTrip = (formValues, medications) => {
    const payload = toDischargeDraftPayload({
      values: { medications: formValues },
      dischargeNotes: [],
      isPharmacyOrderEnabled: true,
    });
    return buildMedicationsInitialValues({
      encounterMedications: medications,
      ongoingMedications: [],
      draft: payload,
      isPharmacyOrderEnabled: true,
    });
  };

  it('returns what the clinician entered, including cleared fields', () => {
    const formValues = {
      'prescription-1': { quantity: 2, repeats: '1', sendToPharmacy: true },
      'prescription-2': { quantity: null, repeats: '', sendToPharmacy: false },
    };
    const medications = [
      { id: 'prescription-1', quantity: 5, repeats: 3 },
      { id: 'prescription-2', quantity: 5, repeats: 3 },
    ];

    expect(roundTrip(formValues, medications)).toEqual(formValues);
  });
});
