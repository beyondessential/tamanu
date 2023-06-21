import React from 'react';
import styled from 'styled-components';
import { NoteContentSection } from './SimplePrintout';
import { BodyText } from '../../../Typography';

export const StyledNotesSectionWrapper = styled.div`
  margin-top: 30px;
  margin-bottom: 40px;
  padding-bottom: 10px;
`;

const StyledId = styled.b`
  margin-right: 10px;
`;

export const NotesSection = ({ idsAndNotes }) => {
  const notes = idsAndNotes
    .map(([id, noteObjects]) => {
      const content = noteObjects.map(n => n.content).join(', ');
      if (!content) {
        return null;
      }
      return {
        content: (
          <BodyText key={id} mb={2}>
            {idsAndNotes.length > 1 && <StyledId>{id}</StyledId>}
            {content}
          </BodyText>
        ),
      };
    })
    .filter(note => !!note);
  return (
    <StyledNotesSectionWrapper>
      <NoteContentSection title="Notes" notes={notes} height="auto" separator={null} boldTitle />
    </StyledNotesSectionWrapper>
  );
};
