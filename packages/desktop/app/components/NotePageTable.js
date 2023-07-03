import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import Tooltip from '@material-ui/core/Tooltip';
import { isAfter } from 'date-fns';

import { NOTE_TYPES } from '@tamanu/shared/constants';

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
    background-color: ${Colors.primaryDark};
    color: ${Colors.white};
    font-weight: 400;
    font-size: 11px;
    line-height: 15px;
    white-space: pre-line;
    cursor: pointer;
    max-width: 700px;
    display: -webkit-box;
    -webkit-line-clamp: 10;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;
const StyledNoteItemLogMetadata = styled.div`
  color: ${Colors.white};
`;
const StyledTooltipNoteContent = styled.p`
  margin-bottom: 0;
`;

const ItemTooltip = ({ childNoteItems = [] }) => {
  if (!childNoteItems.length) {
    return null;
  }

  return childNoteItems.map(noteItem => (
    <div key={noteItem.id}>
      <StyledNoteItemLogMetadata>
        <StyledTooltipNoteContent>{noteItem.content}</StyledTooltipNoteContent>
        {noteItem.author?.displayName ? <span>{noteItem.author.displayName} </span> : null}
        {noteItem.onBehalfOf?.displayName ? (
          <span>on behalf of {noteItem.onBehalfOf.displayName} </span>
        ) : null}
        {Boolean(noteItem.noteItems) && <span> (edited) </span>}
        <DateDisplay date={noteItem.date} showTime />
      </StyledNoteItemLogMetadata>
    </div>
  ));
};

const getDate = ({ noteItems }) => {
  const rootNoteItems = groupRootNoteItems(noteItems, (n1, n2) =>
    isAfter(new Date(n2.date), new Date(n1.date)) ? 1 : -1,
  );
  return <DateDisplay date={rootNoteItems[0]?.date} showTime />;
};
const getTypeLabel = ({ noteType }) => noteTypes.find(x => x.value === noteType).label;
const getContent = ({ noteItems }) => {
  const rootNoteItems = groupRootNoteItems(noteItems, (n1, n2) =>
    isAfter(new Date(n2.date), new Date(n1.date)) ? 1 : -1,
  );
  return (
    <StyledTooltip arrow followCursor title={<ItemTooltip childNoteItems={rootNoteItems} />}>
      <span>{rootNoteItems[0]?.content || ''}</span>
    </StyledTooltip>
  );
};

const COLUMNS = [
  {
    key: 'date',
    title: 'Date',
    accessor: getDate,
    sortable: false,
  },
  { key: 'noteType', title: 'Type', accessor: getTypeLabel, sortable: false },
  { key: 'content', title: 'Content', maxWidth: 300, accessor: getContent, sortable: false },
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

      if (data.noteType === NOTE_TYPES.SYSTEM) {
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
          cancelText="Close"
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
