import React, { useCallback, useState } from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { noteTypes } from '../constants';
import { NotePageModal } from './NotePageModal';

const getTypeLabel = ({ type }) => noteTypes.find(x => x.value === type).label;
const getContent = ({ noteItems }) => noteItems[0]?.content || '';

const COLUMNS = [
  { key: 'date', title: 'Date', accessor: ({ date }) => <DateDisplay date={date} showTime /> },
  { key: 'type', title: 'Type', accessor: getTypeLabel },
  { key: 'content', title: 'Content', maxWidth: 300, accessor: getContent },
];

export const NoteTable = ({ encounterId }) => {
  const [isNotePageModalOpen, setNotePageModalOpen] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [notePage, setNotePage] = useState({});
  const handleRowClick = useCallback(
    data => {
      setNotePageModalOpen(true);
      setNotePage(data);
    },
    [setNotePageModalOpen, setNotePage],
  );
  const sortNotes = useCallback(notes => {
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
      <NotePageModal
        open={isNotePageModalOpen}
        encounterId={encounterId}
        onClose={() => setNotePageModalOpen(false)}
        onSaved={() => {
          setRefreshCount(refreshCount + 1);
        }}
        notePage={notePage}
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
