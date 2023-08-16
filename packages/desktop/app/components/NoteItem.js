import React, { useState } from 'react';
import styled from 'styled-components';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import EditIcon from '@material-ui/icons/Edit';
import Tooltip from '@material-ui/core/Tooltip';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import { NOTE_PERMISSION_TYPES } from '@tamanu/shared/constants';

import { DateDisplay } from './DateDisplay';
import { TextInput } from './Field/TextField';
import { Colors } from '../constants';
import { useAuth } from '../contexts/Auth';
import { withPermissionCheck } from './withPermissionCheck';

const EditTextWrapper = styled.div`
  width: 100%;
  margin-bottom: 10px;
`;
const StyledEditIcon = styled(EditIcon)`
  float: right;
  width: 1rem;
  height: 1rem;
  color: ${Colors.primary};
`;
const StyledSaveText = styled.span`
  float: right;
  font-size: 11px;
  font-weight: bold;
  text-decoration: underline;
  bottom: 0;
  right: 10px;
  cursor: pointer;
  color: ${Colors.primary};
`;
const StyledCancelText = styled.span`
  float: right;
  font-size: 11px;
  text-decoration: underline;
  bottom: 0;
  right: 30px;
  margin-right: 10px;
  cursor: pointer;
`;
const StyledListItemText = styled(ListItemText)`
  .MuiListItemText-primary {
    font-size: 14px;
    line-height: 18px;
    white-space: pre-line;
    width: 100%;
  }
`;
const StyledNoteItemSecondaryWrapper = styled.div`
  float: right;
  font-size: 11px;
  line-height: 18px;
  color: ${Colors.softText};
`;
const StyledViewChangeLogWrapper = styled.span`
  float: right;
  margin-left: 10px;
  font-size: 11px;
  font-weight: bold;
  text-decoration: underline;
  cursor: pointer;
  color: ${Colors.primary};
`;
const StyledNoteItemLogMetadata = styled.div`
  color: ${Colors.softText};
`;
const StyledNoteItemLogContent = styled.div`
  color: ${Colors.darkestText};
`;
const StyledTooltip = styled(props => (
  <ClickAwayListener onClickAway={props.onClickAway}>
    <Tooltip classes={{ popper: props.className }} {...props}>
      {props.children}
    </Tooltip>
  </ClickAwayListener>
))`
  z-index: 1500;
  pointer-events: auto;

  & .MuiTooltip-tooltip {
    background-color: ${Colors.white};
    color: ${Colors.darkText};
    border: 1px solid ${Colors.outline};
    box-shadow: 0 1px 3px ${Colors.outline};
    font-size: 11px;
    font-weight: 400;
    white-space: pre-line;
    cursor: pointer;
    overflow-y: auto;
    max-height: 700px;
    max-width: 700px;
  }
`;

const ItemTooltip = ({ childNoteItems = [] }) => {
  if (!childNoteItems.length) {
    return null;
  }

  return childNoteItems.map(noteItem => (
    <div key={noteItem.id}>
      <StyledNoteItemLogMetadata>
        {noteItem.author?.displayName ? <span>{noteItem.author.displayName} </span> : null}
        {noteItem.onBehalfOf?.displayName ? (
          <span>on behalf of {noteItem.onBehalfOf.displayName} </span>
        ) : null}
        <DateDisplay date={noteItem.date} showTime />
      </StyledNoteItemLogMetadata>

      <StyledNoteItemLogContent>{noteItem.content}</StyledNoteItemLogContent>
      <br />
    </div>
  ));
};

const NoteItemMain = ({ noteItem }) => <span>{noteItem.content} </span>;

const NoteItemSecondary = ({ noteItem, isEditting, onEditClick, hasPermission }) => {
  const [isTooltipOpen, setTooltipOpen] = useState(false);
  const { currentUser } = useAuth();

  return (
    <StyledNoteItemSecondaryWrapper>
      {!isEditting && (hasPermission || currentUser.id === noteItem.authorId) && (
        <StyledEditIcon onClick={onEditClick} />
      )}
      <br />
      <>
        <span>{noteItem.author?.displayName || ''} </span>
        {noteItem.onBehalfOf ? <span>on behalf of {noteItem.onBehalfOf.displayName} </span> : null}
        <DateDisplay date={noteItem.date} showTime />
        {noteItem?.noteItems?.length > 0 && (
          <>
            <span> (edited) </span>
            <StyledTooltip
              open={isTooltipOpen}
              onClickAway={() => setTooltipOpen(false)}
              title={<ItemTooltip childNoteItems={noteItem.noteItems} />}
            >
              <StyledViewChangeLogWrapper onClick={() => setTooltipOpen(true)}>
                View change log
              </StyledViewChangeLogWrapper>
            </StyledTooltip>
          </>
        )}
      </>
    </StyledNoteItemSecondaryWrapper>
  );
};

const NoteItemSecondaryWithPermission = withPermissionCheck(NoteItemSecondary);

export const NoteItem = ({ index, noteItem, onEditNoteItem, lastNoteItemRef }) => {
  const [isEditting, setIsEditting] = useState(false);
  const [content, setContent] = useState(noteItem.content);
  const handleDone = () => {
    onEditNoteItem(noteItem, content);
    setIsEditting(!isEditting);
  };

  return (
    <>
      {index !== 0 && <Divider />}
      <ListItem ref={lastNoteItemRef}>
        {isEditting ? (
          <EditTextWrapper>
            <TextInput
              style={{ width: '100%' }}
              fullWidth
              value={content}
              multiline
              onChange={event => setContent(event.target.value)}
            />
            <StyledSaveText onClick={handleDone}>Save</StyledSaveText>
            <StyledCancelText
              onClick={() => {
                // resetting note item content
                setContent(noteItem.content);
                setIsEditting(!isEditting);
              }}
            >
              Cancel
            </StyledCancelText>
          </EditTextWrapper>
        ) : (
          <StyledListItemText
            primary={
              <>
                <NoteItemMain noteItem={noteItem} />
                <NoteItemSecondaryWithPermission
                  noteItem={noteItem}
                  isEditting={isEditting}
                  onEditClick={() => setIsEditting(!isEditting)}
                  verb="write"
                  noun={NOTE_PERMISSION_TYPES.OTHER_PRACTITIONER_ENCOUNTER_NOTE}
                />
              </>
            }
          />
        )}
      </ListItem>
    </>
  );
};
