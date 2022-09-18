import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import Tooltip from '@material-ui/core/Tooltip';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { noteTypes, Colors } from '../constants';
import { groupRootNoteItems } from '../utils/groupRootNoteItems';
import { NotePageModal } from './NotePageModal';
import { withPermissionCheck } from './withPermissionCheck';

const StyledTooltip = styled(props => (
  <Tooltip classes={{ popper: props.className }} {...props}>
    {props.children}
  </Tooltip>
))`
  z-index: 1500;
  pointer-events: auto;

  & .MuiTooltip-tooltip {
    background-color: ${Colors.primary};
    color: ${Colors.white};
    font-weight: 400;
    font-size: 11px;
    line-height: 15px;
    white-space: pre-line;
    cursor: pointer;
  }
`;
const StyledNoteItemLogMetadata = styled.div`
  color: ${Colors.white};
`;

const ItemTooltip = ({ childNoteItems = [] }) => {
  if (!childNoteItems.length) {
    return null;
  }

  // only show the first 5 items
  const newChildNoteItems = childNoteItems.slice(0, 5);
  return newChildNoteItems.map(noteItem => (
    <div key={noteItem.id}>
      <StyledNoteItemLogMetadata>
        <p>{noteItem.content}</p>
        <span>{noteItem.author.displayName} </span>
        {noteItem.onBehalfOf ? <span>on behalf of {noteItem.onBehalfOf.displayName} </span> : null}
        {Boolean(noteItem.noteItems) && <span> (edited) </span>}
        <DateDisplay date={noteItem.date} showTime />
      </StyledNoteItemLogMetadata>
      <br />
    </div>
  ));
};

const getTypeLabel = ({ noteType }) => noteTypes.find(x => x.value === noteType).label;
const getContent = ({ noteItems }) => {
  const rootNoteItems = groupRootNoteItems(noteItems);
  return (
    <StyledTooltip
      arrow
      enterDelay={500}
      leaveDelay={200}
      followCursor
      title={<ItemTooltip childNoteItems={rootNoteItems} />}
    >
      <span>{rootNoteItems[0]?.content || ''}</span>
    </StyledTooltip>
  );
};

const COLUMNS = [
  { key: 'date', title: 'Date', accessor: ({ date }) => <DateDisplay date={date} showTime /> },
  { key: 'noteType', title: 'Type', accessor: getTypeLabel },
  { key: 'content', title: 'Content', maxWidth: 300, accessor: getContent },
];

const NotePageTable = ({ encounterId, hasPermission }) => {
  const [isNotePageModalOpen, setNotePageModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);
  const [notePage, setNotePage] = useState(null);
  const handleRowClick = useCallback(
    data => {
      if (!hasPermission) {
        return;
      }

      setModalTitle(`Note - ${getTypeLabel(data)}`);
      setNotePageModalOpen(true);
      setNotePage(data);
    },
    [hasPermission, setNotePageModalOpen, setNotePage],
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
    <>
      {hasPermission && (
        <NotePageModal
          open={isNotePageModalOpen}
          encounterId={encounterId}
          onClose={() => setNotePageModalOpen(false)}
          onSaved={() => {
            setRefreshCount(refreshCount + 1);
          }}
          notePage={notePage}
          title={modalTitle}
        />
      )}

      <DataFetchingTable
        columns={COLUMNS}
        endpoint={`encounter/${encounterId}/notePages`}
        onRowClick={handleRowClick}
        customSort={sortNotes}
        refreshCount={refreshCount}
        elevated={false}
      />
    </>
  );
};

export const NotePageTableWithPermission = withPermissionCheck(NotePageTable);
