/*
Returns the first Note (Sequelize model instance) with the specified noteType, or undefined.

notes: Array<SequelizeModel>
noteType: string
*/
export const getNoteWithType = (notes, noteType) => {
  return getNotesWithType(notes, noteType)[0];
};

/*
Returns all Notes (Sequelize model instances) with the specified noteType, which may be an empty
array.

notes: Array<SequelizeModel>
noteType: string
*/
export const getNotesWithType = (notes, noteType) => {
  return notes.filter(note => note.noteType === noteType);
};
