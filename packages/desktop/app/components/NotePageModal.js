import React, { useState, useEffect, useCallback } from 'react';
import { NOTE_RECORD_TYPES } from 'shared/constants';

import { useApi } from '../api';
import { Suggester } from '../utils/suggester';
import { groupRootNoteItems } from '../utils/groupRootNoteItems';

import { Modal } from './Modal';
import { NotePageForm } from '../forms/NotePageForm';
import { useAuth } from '../contexts/Auth';

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
        const rootNoteItems = groupRootNoteItems(newNoteItems);

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

      const rootNoteItems = groupRootNoteItems(newNoteItems);

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
      const rootNoteItems = groupRootNoteItems(newNoteItems);

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
