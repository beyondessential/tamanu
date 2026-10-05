import asyncHandler from 'express-async-handler';
import { ForeignKeyConstraintError, ValidationError } from 'sequelize';

import { InvalidOperationError, InvalidParameterError, NotFoundError } from '@tamanu/errors';

/**
 * A clinician's part-finished discharge form.
 *
 * Every handler here scopes to the requesting user: a draft is that clinician's own working
 * state, so the owner is never taken from the request.
 */

const serialiseDischargeDraft = draft =>
  draft && {
    endDate: draft.endDate,
    dischargerId: draft.dischargerId,
    dispositionId: draft.dispositionId,
    note: draft.note,
    seededNoteIds: draft.seededNoteIds ?? [],
    orderingClinicianId: draft.orderingClinicianId,
    medications: (draft.medications ?? []).map(medication => ({
      prescriptionId: medication.prescriptionId,
      quantity: medication.quantity,
      repeats: medication.repeats,
      sendToPharmacy: medication.sendToPharmacy,
    })),
  };

const findOwnDischargeDraft = (models, encounterId, userId) =>
  models.EncounterDischargeDraft.findOne({
    where: { encounterId, userId },
    include: [{ model: models.EncounterDischargeDraftMedication, as: 'medications' }],
  });

// A part-finished form clears fields as readily as it fills them, and an emptied input sends ''
// rather than null. An id column will not take '' as a key, so an emptied one is simply unset.
const draftIdOrNull = value => (value === '' || value == null ? null : value);

// Picked field by field rather than spreading the body: the encounter and the owning user are
// what scope a draft, so letting a request set them would let one clinician write into another's.
const pickDischargeDraftValues = body => ({
  endDate: draftIdOrNull(body.endDate),
  dischargerId: draftIdOrNull(body.dischargerId),
  dispositionId: draftIdOrNull(body.dispositionId),
  note: body.note ?? null,
  seededNoteIds: Array.isArray(body.seededNoteIds) ? body.seededNoteIds : [],
  orderingClinicianId: draftIdOrNull(body.orderingClinicianId),
});

/**
 * An emptied number input for a nullable integer column.
 *
 * Anything that is not a number is treated as cleared rather than passed on: `Number('abc')` is
 * NaN, which the column rejects, and a draft is not worth failing a save over.
 */
const draftNumberOrNull = value => {
  if (value === '' || value == null) return null;
  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? asNumber : null;
};

const pickDischargeDraftMedication = medication => ({
  prescriptionId: medication.prescriptionId,
  quantity: draftNumberOrNull(medication.quantity),
  repeats: draftNumberOrNull(medication.repeats),
  sendToPharmacy: Boolean(medication.sendToPharmacy),
});

/**
 * Reading and discarding a draft need only the encounter: a draft is the requesting clinician's
 * own working state, and the discharge form opens on write Encounter, so requiring write Discharge
 * to discard would leave a clinician who can open the form but not save a draft unable to get out
 * of one they had edited.
 */
const loadEncounterForDraftRead = async req => {
  const { models, params } = req;
  req.checkPermission('read', 'Encounter');
  const encounterObject = await models.Encounter.findByPk(params.id);
  if (!encounterObject) throw new NotFoundError();
  return encounterObject;
};

/** Saving, unlike reading and discarding, is a write against the encounter's discharge. */
const loadEncounterForDraftSave = async req => {
  const encounterObject = await loadEncounterForDraftRead(req);
  req.checkPermission('write', 'Discharge');
  if (encounterObject.endDate) {
    throw new InvalidOperationError('Cannot save a discharge draft on a discharged encounter.');
  }
  return encounterObject;
};

/**
 * A draft is saved without validation because the form it comes from is part-finished, so its
 * id columns reach the database unchecked. An id that does not resolve, or a medication line with
 * none at all, is a bad request from the client rather than a server fault.
 */
const saveWithReadableIdErrors = async save => {
  try {
    return await save();
  } catch (error) {
    if (error instanceof ForeignKeyConstraintError || error instanceof ValidationError) {
      throw new InvalidParameterError(
        'Discharge draft refers to a record that does not exist. Check the clinician, disposition and prescription ids.',
      );
    }
    throw error;
  }
};

export const getDischargeDraft = asyncHandler(async (req, res) => {
  const { models, params, user } = req;
  await loadEncounterForDraftRead(req);

  const draft = await findOwnDischargeDraft(models, params.id, user.id);
  res.send({ draft: serialiseDischargeDraft(draft) ?? null });
});

export const saveDischargeDraft = asyncHandler(async (req, res) => {
  const { db, models, params, user, body } = req;
  await loadEncounterForDraftSave(req);

  const draftValues = pickDischargeDraftValues(body);
  const lines = Array.isArray(body.medications) ? body.medications : [];

  // The prescription is what a line is about, so a line without one is a malformed request
  // rather than something to discover as a not-null violation at insert time.
  if (lines.some(line => !line.prescriptionId)) {
    throw new InvalidParameterError('Every discharge draft medication needs a prescription.');
  }

  const saved = await saveWithReadableIdErrors(() =>
    db.transaction(async () => {
      // findOrCreate rather than find-then-create: the pair is unique per encounter and clinician,
      // so two saves racing (a double-clicked Save & exit, a retried request) would both miss a
      // plain lookup and the second insert would hit the constraint.
      const [draft, wasCreated] = await models.EncounterDischargeDraft.findOrCreate({
        where: { encounterId: params.id, userId: user.id },
        defaults: { ...draftValues, encounterId: params.id, userId: user.id },
      });
      if (!wasCreated) await draft.update(draftValues);

      // The lines are replaced wholesale: the draft is whatever was on screen when the clinician
      // left, so a prescription missing from the payload is one they no longer had. A discharge
      // can carry every medication the patient is on, so they go in one statement.
      await models.EncounterDischargeDraftMedication.destroy({
        where: { dischargeDraftId: draft.id },
        force: true,
      });
      const medications = await models.EncounterDischargeDraftMedication.bulkCreate(
        lines.map(line => ({ ...pickDischargeDraftMedication(line), dischargeDraftId: draft.id })),
      );

      // Assembled from what was just written rather than read back: the response is the draft
      // the client already holds, and it seeds their cache without a further round trip.
      return { ...draft.get({ plain: true }), medications };
    }),
  );

  res.send({ draft: serialiseDischargeDraft(saved) });
});

export const discardDischargeDraft = asyncHandler(async (req, res) => {
  const { models, params, user } = req;
  await loadEncounterForDraftRead(req);

  await models.EncounterDischargeDraft.destroy({
    where: { encounterId: params.id, userId: user.id },
    force: true,
  });

  res.send({ draft: null });
});
