import React from 'react';

import { useNoteModal } from '../contexts/NoteModal';
import { ConditionalTooltip } from './Tooltip';
import { TranslatedText } from './Translation/TranslatedText';

export const NoteModalActionBlocker = ({ children, isNavigationBlock = false }) => {
  const { isNoteModalOpen } = useNoteModal();

  if (!isNoteModalOpen) {
    return children;
  }

  return React.Children.map(children, child => {
    if (!React.isValidElement(child)) return child;

    return (
      <ConditionalTooltip
        visible
        title={
          isNavigationBlock ? (
            <TranslatedText
              stringId="note.modal.navigationBlock.tooltip"
              fallback="Cannot navigate away from patient with unsaved note"
            />
          ) : (
            <TranslatedText
              stringId="note.modal.actionBlock.tooltip"
              fallback="Can't perform this action while recording a note"
            />
          )
        }
        $maxWidth={'10rem'}
      >
        <div className="pointer-events-none">{child}</div>
      </ConditionalTooltip>
    );
  });
};
