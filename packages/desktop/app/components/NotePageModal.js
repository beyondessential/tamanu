import React, { useState, useEffect, useCallback } from 'react';
import { groupBy } from 'lodash';
import { NOTE_RECORD_TYPES } from 'shared/constants';

import { useApi } from '../api';
import { Suggester } from '../utils/suggester';

import { Modal } from './Modal';
import { NotePageForm } from '../forms/NotePageForm';
import { useAuth } from '../contexts/Auth';

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
const groupNoteItems = noteItems => {
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

export const NotePageModal = ({
  title = 'Note',
  open,
  onClose,
  onSaved,
  encounterId,
  notePage,
}) => {
  const api = useApi();
  const { currentUser } = useAuth();
  const [noteItems, setNoteItems] = useState([]);
  const [noteTypeCountByType, setNoteTypeCountByType] = useState({});
  const practitionerSuggester = new Suggester(api, 'practitioner');

  useEffect(() => {
    (async () => {
      if (notePage) {
        const noteItemsResponse = await api.get(`notePages/${notePage.id}/noteItems`);
        const newNoteItems = noteItemsResponse.data;
        const rootNoteItems = groupNoteItems(newNoteItems);

        setNoteItems(rootNoteItems);
      }
      const noteTypeCountResponse = await api.get(`encounter/${encounterId}/notePages/noteTypes`);
      setNoteTypeCountByType(noteTypeCountResponse.data);
    })();
  }, [api, notePage, encounterId]);

  const handleCreateNewNoteItem = useCallback(
    async (data, { resetForm }) => {
      const newData = {
        ...data,
        authorId: currentUser.id,
        recordId: encounterId,
        recordType: NOTE_RECORD_TYPES.ENCOUNTER,
      };

      let newNoteItems;

      if (notePage?.id) {
        await api.post(`notePages/${notePage.id}/noteItems`, newData);
        const response = await api.get(`notePages/${notePage.id}/noteItems`);
        newNoteItems = response.data;
      } else {
        const response = await api.post('notePages', newData);
        newNoteItems = [response.noteItem];
      }

      const rootNoteItems = groupNoteItems(newNoteItems);

      setNoteItems(rootNoteItems);
      resetForm();
      onSaved();
    },
    [api, currentUser.id, encounterId, notePage, setNoteItems, onSaved],
  );

  const handleEditNoteItem = useCallback(
    async (noteItem, content) => {
      if (!notePage) {
        return;
      }

      const newNoteItem = {
        authorId: currentUser.id,
        onBehalfOfId: noteItem.onBehalfOfId,
        revisedById: noteItem.revisedById || noteItem.id,
        content,
      };

      await api.post(`notePages/${notePage.id}/noteItems`, newNoteItem);
      const response = await api.get(`notePages/${notePage.id}/noteItems`);

      const newNoteItems = response.data;
      const rootNoteItems = groupNoteItems(newNoteItems);

      setNoteItems(rootNoteItems);
    },
    [api, currentUser.id, notePage],
  );

  return (
    <Modal title={title} open={open} width="md" onClose={onClose}>
      <NotePageForm
        onSubmit={handleCreateNewNoteItem}
        onEditNoteItem={handleEditNoteItem}
        onCancel={onClose}
        practitionerSuggester={practitionerSuggester}
        notePage={notePage}
        noteItems={noteItems}
        noteTypeCountByType={noteTypeCountByType}
      />
    </Modal>
  );
};
