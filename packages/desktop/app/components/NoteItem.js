import React, { useState } from 'react';
import styled from 'styled-components';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import EditIcon from '@material-ui/icons/Edit';
import DoneIcon from '@material-ui/icons/Done';
import CloseIcon from '@material-ui/icons/Close';
import Tooltip from '@material-ui/core/Tooltip';

import { DateDisplay } from './DateDisplay';
import { TextInput } from './Field/TextField';
import { Colors } from '../constants';

const EditTextWrapper = styled.div`
  width: 100%;
`;
const StyledListItem = styled(ListItem)``;
const StyledEditIcon = styled(EditIcon)`
  float: right;
  width: 1rem;
  height: 1rem;
  color: ${Colors.primary};
`;
const StyledDoneIcon = styled(DoneIcon)`
  float: right;
  width: 1rem;
  height: 1rem;
  bottom: 0;
  right: 10px;
  color: ${Colors.primary};
`;
const StyledCloseIcon = styled(CloseIcon)`
  float: right;
  width: 1rem;
  height: 1rem;
  bottom: 0;
  right: 30px;
`;
const StyledListItemText = styled(ListItemText)`
  .MuiListItemText-primary {
    font-size: 14px;
    line-height: 18px;
    white-space: pre-line;
  }
`;
const StyledNoteItemSecondaryWrapper = styled.div`
  float: right;
  font-size: 11px;
  line-height: 18px;
`;
const StyledViewChangeLogWrapper = styled.span`
  float: right;
  margin-left: 10px;
  font-size: 11px;
  font-weight: bold;
  text-decoration: underline;
  color: ${Colors.primary};
`;
const StyledTooltip = styled(props => (
  <Tooltip classes={{ popper: props.className }} {...props}>
    {props.children}
  </Tooltip>
))`
  & .MuiTooltip-tooltip {
    background-color: ${Colors.white};
    color: ${Colors.darkText};
    border: 1px solid ${Colors.outline};
    box-shadow: 0 1px 3px ${Colors.outline};
    font-size: 11px;
    font-weight: 400;
    white-space: pre-line;
    cursor: pointer;
    max-height: 700px;
    width: 500px;
  }
`;

const ItemTooltip = ({ childNoteItems = [] }) => {
  if (!childNoteItems.length) {
    return null;
  }

  return childNoteItems.map(noteItem => (
    <>
      <span>{noteItem.author.displayName} </span>
      {noteItem.onBehalfOf ? <span>on behalf of {noteItem.onBehalfOf.displayName} </span> : null}
      <DateDisplay date={noteItem.date} showTime />
      <p>{noteItem.content}</p>
      <br />
    </>
  ));
};

const NoteItemMain = ({ noteItem }) => <span>{noteItem.content} </span>;

const NoteItemSecondary = ({ noteItem, isEditting, onEditClick }) => {
  const [isTooltipOpen, setTooltipOpen] = useState(false);

  return (
    <StyledNoteItemSecondaryWrapper>
      {!isEditting && <StyledEditIcon onClick={onEditClick} />}
      <br />
      <>
        <span>{noteItem.author.displayName} </span>
        {noteItem.onBehalfOf ? <span>on behalf of {noteItem.onBehalfOf.displayName} </span> : null}
        <DateDisplay date={noteItem.date} showTime />
        {noteItem?.noteItems?.length > 0 && <span> (edited) </span>}
        {noteItem?.noteItems?.length > 0 && (
          <StyledTooltip
            open={isTooltipOpen}
            title={<ItemTooltip childNoteItems={noteItem.noteItems} />}
          >
            <StyledViewChangeLogWrapper onClick={() => setTooltipOpen(!isTooltipOpen)}>
              View change log
            </StyledViewChangeLogWrapper>
          </StyledTooltip>
        )}
      </>
    </StyledNoteItemSecondaryWrapper>
  );
};

export const NoteItem = ({ noteItem, onEditNoteItem }) => {
  const [isEditting, setIsEditting] = useState(false);
  const [content, setContent] = useState(noteItem.content);
  const handleDone = () => {
    onEditNoteItem(noteItem, content);
    setIsEditting(!isEditting);
  };

  return (
    <>
      <Divider />
      <StyledListItem>
        {isEditting ? (
          <EditTextWrapper>
            <TextInput
              style={{ width: '100%' }}
              fullWidth
              value={content}
              multiline
              onChange={event => setContent(event.target.value)}
            />
            <StyledDoneIcon onClick={handleDone} />
            <StyledCloseIcon onClick={() => setIsEditting(!isEditting)} />
          </EditTextWrapper>
        ) : (
          <StyledListItemText
            primary={
              <>
                <NoteItemMain noteItem={noteItem} />
                <NoteItemSecondary
                  noteItem={noteItem}
                  isEditting={isEditting}
                  onEditClick={() => setIsEditting(!isEditting)}
                />
              </>
            }
          />
        )}
      </StyledListItem>
    </>
  );
};
