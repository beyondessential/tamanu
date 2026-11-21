import React, { useCallback, useState } from 'react';
import { Colors } from '../../constants';
import { HandoverNotesIcon } from '../../assets/icons/HandoverNotesIcon';
import { ThemedTooltip } from '../Tooltip';
import { TranslatedText } from '../Translation/TranslatedText';
import { HandoverNotesModal } from './HandoverNotesModal';
import { PrintActionButton } from './PrintActionButton';

export const HandoverNotesButton = React.memo(({ area }) => {
  const [handoverNotesModalShown, setHandoverNotesModalShown] = useState(false);

  const handleHandoverNotesButtonClick = useCallback(
    () => setHandoverNotesModalShown(true),
    [setHandoverNotesModalShown],
  );

  const handleHandoverNotesModalClose = useCallback(
    () => setHandoverNotesModalShown(false),
    [setHandoverNotesModalShown],
  );

  const handoverNotesButtonDisabled = !area;

  return (
    <>
      <PrintActionButton
        disabled={handoverNotesButtonDisabled}
        startIcon={
          <HandoverNotesIcon
            color={area ? Colors.primary : Colors.softText}
            data-testid="handovernotesicon-d4ts"
          />
        }
        onClick={handleHandoverNotesButtonClick}
        data-testid="handovernotesbutton-40su"
      >
        {handoverNotesButtonDisabled ? (
          <ThemedTooltip
            title={
              <TranslatedText
                stringId="bedManagement.search.handoverNotes.tooltip"
                fallback="Select an 'Area' to create handover notes"
                data-testid="translatedtext-g7x4"
              />
            }
            data-testid="themedtooltip-25rl"
          >
            <span>
              <TranslatedText
                stringId="bedManagement.search.handoverNotes.button.label"
                fallback="Handover notes"
                data-testid="translatedtext-7sg3"
              />
            </span>
          </ThemedTooltip>
        ) : (
          <TranslatedText
            stringId="bedManagement.search.handoverNotes.button.label"
            fallback="Handover notes"
            data-testid="translatedtext-94wp"
          />
        )}
      </PrintActionButton>
      <HandoverNotesModal
        open={handoverNotesModalShown}
        onClose={handleHandoverNotesModalClose}
        printable
        width="md"
        keepMounted
        area={area}
        data-testid="handovernotesmodal-el85"
      />
    </>
  );
});
