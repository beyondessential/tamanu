import { NOTE_PERMISSION_TYPES, NOTE_RECORD_TYPES, NOTE_TYPES } from '@tamanu/constants';

function getParentRecordVerb(verb) {
  switch (verb) {
    case 'list':
    case 'read':
      return 'read';
    case 'write':
    case 'create':
      return 'write';
    default:
      throw new Error(`Verb ${verb} not recognized.`);
  }
}

async function checkIfTreatmentPlanNote(models, noteTypeId) {
  if (!noteTypeId) return false;
  const noteTypeRef = await models.ReferenceData.findByPk(noteTypeId);
  return noteTypeRef?.code === NOTE_TYPES.TREATMENT_PLAN;
}

// Encounter notes have their own permission checks, every other type
// of note should simply check permissions against their parent record.
export async function checkNotePermission(req, note, verb) {
  const { models, user } = req;
  const { noteTypeId, recordType, recordId } = note;
  const parentRecordVerb = getParentRecordVerb(verb);

  if (recordType === NOTE_RECORD_TYPES.ENCOUNTER) {
    req.checkPermission(verb, 'EncounterNote');

    let rootNote;
    if (note.revisedById) {
      rootNote = await models.Note.findByPk(note.revisedById);
    }

    // if rootNote is not available, it means that the current user is creating the root note.
    // then no need to check for special write permissions
    const isCurrentUserEditingOtherPeopleNote = rootNote && user.id !== rootNote.authorId;

    const isTreatmentPlanNote = await checkIfTreatmentPlanNote(models, noteTypeId);

    // Check if user has permission to edit other people's treatment plan notes
    if (
      isCurrentUserEditingOtherPeopleNote && // check if current user is not the person who created the note originally
      isTreatmentPlanNote &&
      parentRecordVerb === 'write'
    ) {
      req.checkPermission(parentRecordVerb, NOTE_PERMISSION_TYPES.TREATMENT_PLAN_NOTE);
      return;
    }

    // Check if user has permission to edit other people's notes
    if (isCurrentUserEditingOtherPeopleNote && parentRecordVerb === 'write') {
      req.checkPermission(
        parentRecordVerb,
        NOTE_PERMISSION_TYPES.OTHER_PRACTITIONER_ENCOUNTER_NOTE,
      );
      return;
    }

    return;
  }

  const parent = await req.models[recordType].findByPk(recordId);
  req.checkPermission(parentRecordVerb, parent);
}
