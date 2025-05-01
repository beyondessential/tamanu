import React from 'react';
import PropTypes from 'prop-types';
import Tooltip from '@material-ui/core/Tooltip';

import { useNoteModal } from '../contexts/NoteModal';
import { TranslatedText } from './Translation/TranslatedText';

export const withNoteModalViewOnly = Component => {
  const WrappedComponent = ({ ...props }) => {
    const { isNoteModalOpen } = useNoteModal();

    if (isNoteModalOpen) {
      return (
        <Tooltip
          title={
            <TranslatedText
              stringId="note.modal.viewOnly.tooltip"
              fallback="Can't perform this action while recording a note"
            />
          }
        >
          <div>
            <Component {...props} disabled={true} />
          </div>
        </Tooltip>
      );
    }

    return <Component {...props} />;
  };

  WrappedComponent.propTypes = {
    hasPermission: PropTypes.bool.isRequired,
  };

  return WrappedComponent;
};
