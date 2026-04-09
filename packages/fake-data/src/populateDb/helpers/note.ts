import { NOTE_RECORD_TYPES } from '@tamanu/constants';
import { randomRecordId } from '@tamanu/database/demoData/utilities';

import { fake, chance } from '../../fake/index.js';
import type { CommonParams } from './common.js';

interface CreateNoteParams extends CommonParams {
  authorId?: string;
}
export const createNote = async ({
  models,
  authorId,
}: CreateNoteParams): Promise<void> => {
  const { Note } = models;

  const recordType = chance.pickone([
    NOTE_RECORD_TYPES.ENCOUNTER,
    NOTE_RECORD_TYPES.PATIENT,
  ]);

  const recordModel = recordType === NOTE_RECORD_TYPES.ENCOUNTER ? 'Encounter' : 'Patient';

  await Note.create(
    fake(Note, {
      recordType,
      recordId: await randomRecordId(models, recordModel),
      authorId: authorId || (await randomRecordId(models, 'User')),
    }),
  );
};
