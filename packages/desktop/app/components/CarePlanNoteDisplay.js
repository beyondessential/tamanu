import React from 'react';
import styled from 'styled-components';

import { Colors } from '../constants';
import { MenuButton } from './MenuButton';
import { useApi } from '../api';
import { DateDisplay } from './DateDisplay';
import { TranslatedText } from './Translation/TranslatedText';

const NoteContainer = styled.div`
  border: 1px solid ${Colors.outline};
  background-color: ${Colors.white};
  margin-bottom: 0.75rem;
`;

const NoteHeaderContainer = styled.div`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${Colors.outline};
  display: flex;
  justify-content: space-between;
`;

const NoteAuthorName = styled.strong`
  color: ${Colors.darkText};
`;

const NoteOnBehalfOf = styled.span`
  color: ${Colors.midText};
`;

const MainCarePlanIndicator = styled.strong`
  color: ${Colors.alert};
  padding-left: 1rem;
`;

const VerticalCenter = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const Timestamp = styled.span`
  color: ${Colors.midText};
  margin-right: 15px;
`;

const NoteContentContainer = styled.div`
  padding-left: 1rem;
  padding-right: 1rem;
`;

const NoteContent = styled.p`
  color: ${Colors.midText};
  white-space: pre-line;
`;

export const CarePlanNoteDisplay = ({ note, isMainCarePlan, onEditClicked, onNoteDeleted }) => {
  const api = useApi();
  const deleteNote = async noteId => api.delete(`notes/${noteId}`);
  return (
    <NoteContainer>
      <NoteHeaderContainer>
        <VerticalCenter>
          <NoteAuthorName>{note.author.displayName}</NoteAuthorName>
          {note.onBehalfOf && note.onBehalfOf.displayName ? (
            <NoteOnBehalfOf>
              &nbsp;&nbsp;|&nbsp;&nbsp;
              <TranslatedText stringId="carePlan.modal.onBehalfOf" fallback="On behalf of" />{' '}
              {note.onBehalfOf.displayName}
            </NoteOnBehalfOf>
          ) : null}
          {isMainCarePlan ? (
            <MainCarePlanIndicator>
              <TranslatedText
                stringId="carePlan.modal.mainCarePlanIndicator"
                fallback="Main care plan"
              />
            </MainCarePlanIndicator>
          ) : null}
        </VerticalCenter>
        <VerticalCenter>
          <Timestamp>
            <DateDisplay date={note.date} />
          </Timestamp>
          <MenuButton
            iconColor={Colors.midText}
            actions={{
              Edit: () => {
                onEditClicked();
              },
              ...(!isMainCarePlan && {
                Delete: async () => {
                  await deleteNote(note.id);
                  onNoteDeleted();
                },
              }),
            }}
          />
        </VerticalCenter>
      </NoteHeaderContainer>
      <NoteContentContainer>
        <NoteContent>{note.content}</NoteContent>
      </NoteContentContainer>
    </NoteContainer>
  );
};
