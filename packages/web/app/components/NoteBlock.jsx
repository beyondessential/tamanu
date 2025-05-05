import React from 'react';

import { useNoteModal } from '../contexts/NoteModal';
import { ConditionalTooltip } from './Tooltip';
import { TranslatedText } from './Translation/TranslatedText';

export const NoteBlock = ({ children, isNavigationBlock = false }) => {
  const { isNoteModalOpen } = useNoteModal();

  if (!isNoteModalOpen) {
    return children;
  }

  return (
    <ConditionalTooltip
      visible
      title={
        isNavigationBlock ? (
          <TranslatedText
            stringId="note.modal.viewOnly.tooltip"
            fallback="Cannot navigate away from patient with unsaved note"
          />
        ) : (
          <TranslatedText
            stringId="note.modal.viewOnly.tooltip"
            fallback="Can't perform this action while recording a note"
          />
        )
      }
    >
      {React.Children.map(children, child =>
        React.cloneElement(child, { disabled: isNoteModalOpen }),
      )}
    </ConditionalTooltip>
  );
};
