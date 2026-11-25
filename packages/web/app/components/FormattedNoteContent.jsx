import React from 'react';
import { parseNoteContent } from '@tamanu/shared/utils/noteContent';

export const getNoteSegmentStyle = ({ bold, italic, underline }) => ({
  fontWeight: bold ? 'bold' : undefined,
  fontStyle: italic ? 'italic' : undefined,
  textDecoration: underline ? 'underline' : undefined,
});

export const FormattedNoteContent = ({ content }) =>
  parseNoteContent(content).map((segment, index) => (
    <span key={index} style={getNoteSegmentStyle(segment)}>
      {segment.text}
    </span>
  ));
