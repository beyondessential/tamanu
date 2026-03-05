import React, { useState } from 'react';
import styled from 'styled-components';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import EditIcon from '@material-ui/icons/Edit';
import Tooltip from '@material-ui/core/Tooltip';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import { NOTE_PERMISSION_TYPES } from '@tamanu/constants';

import { DateDisplay } from './DateDisplay';
import { TextInput } from './Field/TextField';
import { Colors } from '../constants';
import { useAuth } from '../contexts/Auth';
import { withPermissionCheck } from './withPermissionCheck';
import { TranslatedText } from './Translation/TranslatedText';

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
  <ClickAwayListener onClickAway={props.onClickAway} data-testid="clickawaylistener-ttee">
    <Tooltip classes={{ popper: props.className }} {...props} data-testid="tooltip-o9f3">
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

  return childNoteItems.map((noteItem, index) => (
    <div key={noteItem.id}>
      <StyledNoteItemLogMetadata data-testid={`noteitemlogmetadata-fvac-${index}`}>
        {noteItem.author?.displayName ? <span>{noteItem.author.displayName} </span> : null}
        {noteItem.onBehalfOf?.displayName ? (
          <span>
            <TranslatedText
              stringId="note.onBehalfOf"
              fallback="on behalf of :displayName"
              replacements={{
                displayName: noteItem.onBehalfOf.displayName,
              }}
              data-testid="translatedtext-on-behalf-prefix"
            />
          </span>
        ) : null}
        <DateDisplay date={noteItem.date} timeFormat="default" data-testid={`datedisplay-5hu9${index}`} />
      </StyledNoteItemLogMetadata>

      <StyledNoteItemLogContent data-testid={`noteitemlogcontent-8n3s${index}`}>
        {noteItem.content}
      </StyledNoteItemLogContent>
      <br />
    </div>
  ));
};

const NoteItemMain = ({ noteItem }) => <span>{noteItem.content} </span>;

const NoteItemSecondary = ({ noteItem, isEditing, onEditClick, hasPermission }) => {
  const [isTooltipOpen, setTooltipOpen] = useState(false);
  const { currentUser } = useAuth();

  return (
    <StyledNoteItemSecondaryWrapper data-testid="stylednoteitemsecondarywrapper-vit4">
      {!isEditing && (hasPermission || currentUser.id === noteItem.authorId) && (
        <StyledEditIcon onClick={onEditClick} data-testid="styledediticon-s5ol" />
      )}
      <br />
      <>
        <span>{noteItem.author?.displayName || ''} </span>
        {noteItem.onBehalfOf ? (
          <span>
            <TranslatedText
              stringId="note.onBehalfOf"
              fallback="on behalf of :displayName"
              replacements={{
                displayName: noteItem.onBehalfOf.displayName,
              }}
              data-testid="translatedtext-on-behalf-prefix2"
            />
          </span>
        ) : null}
        <DateDisplay date={noteItem.date} timeFormat="default" data-testid="datedisplay-zaes" />
        {noteItem?.noteItems?.length > 0 && (
          <>
            <span>
              <TranslatedText
                stringId="note.status.edited"
                fallback="(edited)"
                data-testid="translatedtext-edited"
              />
            </span>
            <StyledTooltip
              open={isTooltipOpen}
              onClickAway={() => setTooltipOpen(false)}
              title={
                <ItemTooltip childNoteItems={noteItem.noteItems} data-testid="itemtooltip-bv1t" />
              }
              data-testid="styledtooltip-egfj"
            >
              <StyledViewChangeLogWrapper
                onClick={() => setTooltipOpen(true)}
                data-testid="styledviewchangelogwrapper-bl80"
              >
                <TranslatedText
                  stringId="note.action.viewChangeLog"
                  fallback="View change log"
                  data-testid="translatedtext-view-changelog"
                />
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
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(noteItem.content);
  const handleDone = () => {
    onEditNoteItem(noteItem, content);
    setIsEditing(!isEditing);
  };

  return (
    <>
      {index !== 0 && <Divider data-testid="divider-hyr6" />}
      <ListItem ref={lastNoteItemRef} data-testid="listitem-ynmh">
        {isEditing ? (
          <EditTextWrapper data-testid="edittextwrapper-e5gj">
            <TextInput
              style={{ width: '100%' }}
              fullWidth
              value={content}
              multiline
              onChange={event => setContent(event.target.value)}
              data-testid="textinput-l960"
            />
            <StyledSaveText onClick={handleDone} data-testid="styledsavetext-y7f6">
              <TranslatedText
                stringId="general.action.save"
                fallback="Save"
                data-testid="translatedtext-save"
              />
            </StyledSaveText>
            <StyledCancelText
              onClick={() => {
                // resetting note item content
                setContent(noteItem.content);
                setIsEditing(!isEditing);
              }}
              data-testid="styledcanceltext-s95j"
            >
              <TranslatedText
                stringId="general.action.cancel"
                fallback="Cancel"
                data-testid="translatedtext-cancel"
              />
            </StyledCancelText>
          </EditTextWrapper>
        ) : (
          <StyledListItemText
            primary={
              <>
                <NoteItemMain noteItem={noteItem} data-testid="noteitemmain-4p45" />
                <NoteItemSecondaryWithPermission
                  noteItem={noteItem}
                  isEditing={isEditing}
                  onEditClick={() => setIsEditing(!isEditing)}
                  verb="write"
                  noun={NOTE_PERMISSION_TYPES.OTHER_PRACTITIONER_ENCOUNTER_NOTE}
                  data-testid="noteitemsecondarywithpermission-w8d2"
                />
              </>
            }
            data-testid="styledlistitemtext-dxed"
          />
        )}
      </ListItem>
    </>
  );
};
