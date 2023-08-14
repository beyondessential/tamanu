import React, { useState, useEffect, useCallback, useRef } from 'react';
import { isEmpty } from 'lodash';
import { NOTE_RECORD_TYPES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

import { useApi } from '../api';
import { Suggester } from '../utils/suggester';
import { groupRootNoteItems } from '../utils/groupRootNoteItems';

import { Modal } from './Modal';
import { NotePageForm } from '../forms/NotePageForm';
import { ConfirmModal } from './ConfirmModal';
import { useAuth } from '../contexts/Auth';

export const NotePageModal = ({
  title = 'Note',
  open,
  onClose,
  onSaved,
  encounterId,
  notePage,
  cancelText,
}) => {
  const api = useApi();
  const { currentUser } = useAuth();
  const [noteItems, setNoteItems] = useState([]);
  const [noteTypeCountByType, setNoteTypeCountByType] = useState({});
  const [openNoteItemCancelConfirmModal, setOpenNoteItemCancelConfirmModal] = useState(false);
  const contentRef = useRef(null);

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
        onBehalfOfId: currentUser.id !== data.writtenById ? data.writtenById : undefined,
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
        date: getCurrentDateTimeString(),
        onBehalfOfId: noteItem.onBehalfOfId,
        revisedById: noteItem.revisedById || noteItem.id,
        content,
      };

      await api.post(`notePages/${notePage.id}/noteItems`, newNoteItem);
      const response = await api.get(`notePages/${notePage.id}/noteItems`);

      const newNoteItems = response.data;
      const rootNoteItems = groupRootNoteItems(newNoteItems);

      setNoteItems(rootNoteItems);
      onSaved();
    },
    [api, currentUser.id, notePage, onSaved],
  );

  return (
    <>
      <ConfirmModal
        title="Discard add note"
        open={openNoteItemCancelConfirmModal}
        width="sm"
        onCancel={() => setOpenNoteItemCancelConfirmModal(false)}
        onConfirm={() => {
          setOpenNoteItemCancelConfirmModal(false);
          onClose();
        }}
        customContent={<p>Are you sure you want to remove any changes you have made?</p>}
      />
      <Modal
        title={title}
        open={open}
        width="md"
        onClose={() => {
          if (!isEmpty(contentRef.current.textContent)) {
            setOpenNoteItemCancelConfirmModal(true);
          } else {
            onClose();
          }
        }}
      >
        <NotePageForm
          onSubmit={handleCreateNewNoteItem}
          onEditNoteItem={handleEditNoteItem}
          onCancel={() => {
            if (!isEmpty(contentRef.current.textContent)) {
              setOpenNoteItemCancelConfirmModal(true);
            } else {
              onClose();
            }
          }}
          practitionerSuggester={practitionerSuggester}
          notePage={notePage}
          noteItems={noteItems}
          noteTypeCountByType={noteTypeCountByType}
          cancelText={cancelText}
          contentRef={contentRef}
        />
      </Modal>
    </>
  );
};
