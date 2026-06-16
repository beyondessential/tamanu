import { NOTE_RECORD_TYPES } from '@tamanu/constants';
import { randomRecordId } from '../randomRecord.ts';

import { fake, chance } from '../../fake/index.ts';
import type { CommonParams } from './common.ts';

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
