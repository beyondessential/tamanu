import React from 'react';
import styled from 'styled-components';

import { Colors } from '../constants';
import { MenuButton } from './MenuButton';
import { useApi } from '../api';
import { DateDisplay } from './DateDisplay';
import { TranslatedText } from './Translation/TranslatedText';
import { NoteModalActionBlocker } from './NoteModalActionBlocker';

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
    <NoteContainer data-testid="notecontainer-6fi4">
      <NoteHeaderContainer data-testid="noteheadercontainer-yyig">
        <VerticalCenter data-testid="verticalcenter-nh79">
          <NoteAuthorName data-testid="noteauthorname-99dp">
            {note.author.displayName}
          </NoteAuthorName>
          {note.onBehalfOf && note.onBehalfOf.displayName ? (
            <NoteOnBehalfOf data-testid="noteonbehalfof-t1xk">
              &nbsp;&nbsp;|&nbsp;&nbsp;
              <TranslatedText
                stringId="note.table.onBehalfOfText"
                fallback="on behalf of :changeOnBehalfOfName"
                replacements={{ changeOnBehalfOfName: note.onBehalfOf.displayName }}
                data-testid="translatedtext-g90i"
              />
            </NoteOnBehalfOf>
          ) : null}
          {isMainCarePlan ? (
            <MainCarePlanIndicator data-testid="maincareplanindicator-7xik">
              <TranslatedText
                stringId="carePlan.modal.mainCarePlanIndicator"
                fallback="Main care plan"
                data-testid="translatedtext-un3e"
              />
            </MainCarePlanIndicator>
          ) : null}
        </VerticalCenter>
        <VerticalCenter data-testid="verticalcenter-a88o">
          <Timestamp data-testid="timestamp-8vv9">
            <DateDisplay date={note.date} data-testid="datedisplay-rguy" />
          </Timestamp>
          <MenuButton
            iconColor={Colors.midText}
            actions={[
              {
                label: (
                  <TranslatedText
                    stringId="general.action.edit"
                    fallback="Edit"
                    data-testid="translatedtext-v6re"
                  />
                ),
                action: () => {
                  onEditClicked();
                },
                wrapper: action => <NoteModalActionBlocker>{action}</NoteModalActionBlocker>,
              },
              ...(isMainCarePlan
                ? []
                : [
                    {
                      label: (
                        <TranslatedText
                          stringId="general.action.delete"
                          fallback="Delete"
                          data-testid="translatedtext-d4o2"
                        />
                      ),
                      action: async () => {
                        await deleteNote(note.id);
                        onNoteDeleted();
                      },
                      wrapper: action => <NoteModalActionBlocker>{action}</NoteModalActionBlocker>,
                    },
                  ]),
            ]}
            data-testid="menubutton-9qgn"
          />
        </VerticalCenter>
      </NoteHeaderContainer>
      <NoteContentContainer data-testid="notecontentcontainer-iw7x">
        <NoteContent data-testid="notecontent-luye">{note.content}</NoteContent>
      </NoteContentContainer>
    </NoteContainer>
  );
};
