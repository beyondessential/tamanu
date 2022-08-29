import React, { useCallback, useState } from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { noteTypes } from '../constants';
import { NoteModal } from './NoteModal';

const getTypeLabel = ({ type }) => noteTypes.find(x => x.value === type).label;
const getContent = ({ noteItems }) => noteItems[0]?.content || '';

const COLUMNS = [
  { key: 'date', title: 'Date', accessor: ({ date }) => <DateDisplay date={date} showTime /> },
  { key: 'type', title: 'Type', accessor: getTypeLabel },
  { key: 'content', title: 'Content', maxWidth: 300, accessor: getContent },
];

export const NoteTable = ({ encounterId }) => {
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [noteId, setNoteId] = useState(null);
  const [editedObject, setEditedObject] = useState({});
  const handleRowClick = useCallback(
    data => {
      const { id, noteType, authorId, priority, content, date } = data;
      setIsNoteModalOpen(true);
      setNoteId(data.id);
      setEditedObject({
        id,
        noteType,
        authorId,
        priority,
        content,
        date,
      });
    },
    [setIsNoteModalOpen, setNoteId, setEditedObject],
  );
  const sortNotes = useCallback(notes => {
    console.log('notes', notes);
    // The sorting rule for Notes is to pin the Treatment Plans to the top
    // And sort everything chronologically
    const treatmentPlanNotes = notes
      .filter(n => n.noteType === 'treatmentPlan')
      .sort((n1, n2) => n2.date.localeCompare(n1.date));
    const otherNotes = notes
      .filter(n => n.noteType !== 'treatmentPlan')
      .sort((n1, n2) => n2.date.localeCompare(n1.date));
    return [...treatmentPlanNotes, ...otherNotes];
  }, []);

  return (
    <div>
      <NoteModal
        open={isNoteModalOpen}
        encounterId={encounterId}
        noteId={noteId}
        editedObject={editedObject}
        onClose={() => setIsNoteModalOpen(false)}
        onSaved={() => {
          setIsNoteModalOpen(false);
          setRefreshCount(refreshCount + 1);
        }}
      />
      <DataFetchingTable
        columns={COLUMNS}
        endpoint={`encounter/${encounterId}/notePages`}
        onRowClick={handleRowClick}
        customSort={sortNotes}
        refreshCount={refreshCount}
        elevated={false}
      />
    </div>
  );
};
