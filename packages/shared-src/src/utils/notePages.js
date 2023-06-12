/*
Returns the first note (Sequelize Model) with the specified
noteType or undefined.

notes: Array<SequelizeModel>
noteType: string
*/
export const getNoteWithType = (notes, noteType) => {
  return notes.filter(note => note.noteType === noteType)[0];
};
