import React, { useCallback, useState } from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { noteTypes } from '../constants';
import { NoteModal } from './NoteModal';

const getTypeLabel = ({ noteType }) => noteTypes.find(x => x.value === noteType).label;

const COLUMNS = [
  { key: 'date', title: 'Date', accessor: ({ date }) => <DateDisplay date={date} showTime /> },
  { key: 'noteType', title: 'Type', accessor: getTypeLabel },
  { key: 'content', title: 'Content', maxWidth: 400 },
];

export const NoteTable = React.memo(({ encounterId }) => {
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
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
    const treatmentPlanNotes = notes.filter(n => n.noteType === 'treatmentPlan');
    const otherNotes = notes
      .filter(n => n.noteType !== 'treatmentPlan')
      .sort((n1, n2) => n1.date - n2.date);
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
      />
      <DataFetchingTable
        columns={COLUMNS}
        endpoint={`encounter/${encounterId}/notes`}
        onRowClick={handleRowClick}
        customSort={sortNotes}
      />
    </div>
  );
});
