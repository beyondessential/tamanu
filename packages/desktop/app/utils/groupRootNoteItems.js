import { groupBy } from 'lodash';

/**
 * Group flat note items into nested ones:
 * eg:
 * [note1, note2, note3]
 * [
 *  {
 *    'note1'
 *    noteItems: [note2, note3]
 *  }
 * ]
 * @param {*} noteItems
 * @returns
 */
export const groupRootNoteItems = noteItems => {
  const noteItemByRevisedId = groupBy(noteItems, noteItem => noteItem.revisedById || 'root');
  const rootNoteItems = [];

  // noteItemByRevisedId.root should never be empty but just in case
  if (noteItemByRevisedId.root) {
    noteItemByRevisedId.root
      .sort((n1, n2) => n1.date.localeCompare(n2.date))
      .forEach(rootNoteItem => {
        let newRootNodeItem = { ...rootNoteItem };
        let childNoteItems = noteItemByRevisedId[rootNoteItem.id];
        if (childNoteItems?.length) {
          childNoteItems = childNoteItems.sort((n1, n2) => n2.date.localeCompare(n1.date));
          childNoteItems = [...childNoteItems, newRootNodeItem];
          newRootNodeItem = childNoteItems.shift();
        }
        newRootNodeItem.noteItems = childNoteItems;
        rootNoteItems.push(newRootNodeItem);
      });
  }

  return rootNoteItems;
};
