import React from 'react';
import styled from 'styled-components';
import moment from 'moment';

import { Colors } from '../constants';

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

const MainCarePlanIndicator = styled.strong`
  color: ${Colors.alert};
  padding-left: 1rem;
`;

const Timestamp = styled.span`
  color: ${Colors.midText};
`;

const NoteContentContainer = styled.div`
  padding-left: 1rem;
  padding-right: 1rem;
`;

const NoteContent = styled.p`
  color: ${Colors.midText};
`;

export const CarePlanNoteDisplay = props => {
  return (
    <NoteContainer>
      <NoteHeaderContainer>
        <div>
          <NoteAuthorName>{props.note.author.displayName}</NoteAuthorName>
          {props.isMainCarePlan ? (
            <MainCarePlanIndicator>Main Care Plan</MainCarePlanIndicator>
          ) : null}
        </div>
        <div>
          <Timestamp>{moment(props.note.updatedAt).format('LLLL')}</Timestamp>
        </div>
      </NoteHeaderContainer>
      <NoteContentContainer>
        <NoteContent>{props.note.content}</NoteContent>
      </NoteContentContainer>
    </NoteContainer>
  );
};
