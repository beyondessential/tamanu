/*
Returns the first Note (Sequelize model instance) with the specified noteType code, or undefined.

notes: Array<SequelizeModel>
noteType: string (note type code)
*/
export const getNoteWithType = (notes, noteType) => {
  return getNotesWithType(notes, noteType)[0];
};

/*
Returns all Notes (Sequelize model instances) with the specified noteType code, which may be an empty
array.

notes: Array<SequelizeModel>
noteType: string (note type code)
*/
export const getNotesWithType = (notes, noteType) => {
  return notes.filter(note => note.noteTypeReference?.code === noteType);
};
