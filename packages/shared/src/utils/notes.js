/*
Returns the first Note (Sequelize model instance) with the specified noteTypeId, or undefined.

notes: Array<SequelizeModel>
noteTypeId: string (note type ID, e.g., 'notetype-other', 'notetype-system')
*/
export const getNoteWithType = (notes, noteTypeId) => {
  return getNotesWithType(notes, noteTypeId)[0];
};

/*
Returns all Notes (Sequelize model instances) with the specified noteTypeId, which may be an empty
array.

notes: Array<SequelizeModel>
noteTypeId: string (note type ID, e.g., 'notetype-other', 'notetype-system')
*/
export const getNotesWithType = (notes, noteTypeId) => {
  return notes.filter(note => note.noteTypeId === noteTypeId);
};
