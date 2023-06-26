/*
Returns the first NotePage (Sequelize model instance) with the specified noteType, or undefined.

notes: Array<SequelizeModel>
noteType: string
*/
export const getNotePageWithType = (notes, noteType) => {
  return getNotePagesWithType(notes, noteType)[0];
};

/*
Returns all NotePages (Sequelize model instances) with the specified noteType, which may be an empty
array.

notes: Array<SequelizeModel>
noteType: string
*/
export const getNotePagesWithType = (notes, noteType) => {
  return notes.filter(note => note.noteType === noteType);
};
