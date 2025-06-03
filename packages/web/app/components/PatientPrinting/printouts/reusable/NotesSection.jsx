import React from 'react';
import styled from 'styled-components';
import { NoteContentSection } from './SimplePrintout';
import { BodyText } from '../../../Typography';
import { TranslatedText } from '../../../Translation/TranslatedText';

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
          <BodyText key={id} mb={2} data-testid="bodytext-kd1j">
            {idsAndNotes.length > 1 && <StyledId data-testid="styledid-5d74">{id}</StyledId>}
            {content}
          </BodyText>
        ),
      };
    })
    .filter(note => !!note);
  return (
    <StyledNotesSectionWrapper data-testid="stylednotessectionwrapper-dzmv">
      <NoteContentSection
        title={
          <TranslatedText
            stringId="note.section.title"
            fallback="Notes"
            data-testid="translatedtext-notes-title"
          />
        }
        notes={notes}
        height="auto"
        separator={null}
        boldTitle
        data-testid="notecontentsection-g7vg"
      />
    </StyledNotesSectionWrapper>
  );
};
