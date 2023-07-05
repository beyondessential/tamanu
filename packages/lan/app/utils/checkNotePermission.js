import { NOTE_RECORD_TYPES } from 'shared/constants';

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

// Encounter notes have their own permission checks, every other type
// of note should simply check permissions against their parent record.
export async function checkNotePermission(req, note, verb) {
  const { recordType, recordId } = note;
  if (recordType === NOTE_RECORD_TYPES.ENCOUNTER) {
    req.checkPermission(verb, 'EncounterNote');
    return;
  }

  const parent = await req.models[recordType].findByPk(recordId);
  req.checkPermission(getParentRecordVerb(verb), parent);
}
