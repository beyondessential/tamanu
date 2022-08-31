import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { groupBy, keyBy } from 'lodash';

import { useApi } from '../api';
import { Suggester } from '../utils/suggester';

import { Modal } from './Modal';
import { NotePageForm } from '../forms/NotePageForm';
import { useAuth } from '../contexts/Auth';

const groupNoteItems = noteItems => {
  const noteItemByRevisedId = groupBy(noteItems, noteItem => noteItem.revisedById || 'root');
  const rootNoteItems = [];

  // noteItemByRevisedId.root should never be empty but just in case
  if (noteItemByRevisedId.root) {
    noteItemByRevisedId.root.forEach(rootNoteItem => {
      let newRootNodeItem = { ...rootNoteItem };
      let childNoteItems = noteItemByRevisedId[rootNoteItem.id];
      if (childNoteItems?.length) {
        childNoteItems = childNoteItems.sort((a, b) =>
          moment(a.createdAt).isBefore(b.createdAt) ? 1 : -1,
        );
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

  const handleCreateNewNoteItem = async data => {
    const newData = { ...data };
    newData.authorId = currentUser.id;
    newData.recordId = encounterId;
    newData.recordType = 'Encounter';

    let response;
    let newNoteItems;
    if (notePage?.id) {
      response = await api.post(`notePages/${notePage.id}/noteItems`, newData);
      newNoteItems = response.data;
    } else {
      response = await api.post('notePages', newData);
      newNoteItems = [response.noteItem];
    }

    const rootNoteItems = groupNoteItems(newNoteItems);

    setNoteItems(rootNoteItems);

    onSaved();
  };

  const handleSaveItem = async (noteItem, content) => {
    if (!notePage) {
      return;
    }

    const newNoteItem = {
      authorId: currentUser.id,
      onBehalfOfId: noteItem.authorId,
      revisedById: noteItem.revisedById || noteItem.id,
      content,
    };

    const response = await api.post(`notePages/${notePage.id}/noteItems`, newNoteItem);
    const newNoteItems = response.data;
    const rootNoteItems = groupNoteItems(newNoteItems);

    setNoteItems(rootNoteItems);
  };

  return (
    <Modal title={title} open={open} width="md" onClose={onClose}>
      <NotePageForm
        onSubmit={handleCreateNewNoteItem}
        onSaveItem={handleSaveItem}
        onCancel={onClose}
        practitionerSuggester={practitionerSuggester}
        notePage={notePage}
        noteItems={noteItems}
        noteTypeCountByType={noteTypeCountByType}
      />
    </Modal>
  );
};
