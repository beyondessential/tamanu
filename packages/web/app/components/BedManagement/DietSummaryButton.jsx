import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined';
import { Colors } from '../../constants';
import { TranslatedText } from '../Translation/TranslatedText';
import { DietSummaryModal } from './DietSummaryModal';
import { PrintActionButton } from './PrintActionButton';

// InsertChartOutlinedIcon is a MUI icon, so size it via .MuiSvgIcon-root; HandoverNotesIcon is hand-drawn and never matches this rule
const DietSummaryPrintActionButton = styled(PrintActionButton)`
  .MuiSvgIcon-root {
    font-size: 18px;
  }
`;

export const DietSummaryButton = React.memo(({ area }) => {
  const [dietSummaryModalShown, setDietSummaryModalShown] = useState(false);

  const handleDietSummaryButtonClick = useCallback(
    () => setDietSummaryModalShown(true),
    [setDietSummaryModalShown],
  );

  const handleDietSummaryModalClose = useCallback(
    () => setDietSummaryModalShown(false),
    [setDietSummaryModalShown],
  );

  return (
    <>
      <DietSummaryPrintActionButton
        startIcon={<InsertChartOutlinedIcon htmlColor={Colors.primary} />}
        onClick={handleDietSummaryButtonClick}
        data-testid="dietsummarybutton-x3qa"
      >
        <TranslatedText
          stringId="bedManagement.search.dietSummary.button.label"
          fallback="Diet summary"
          data-testid="translatedtext-dietsummary"
        />
      </DietSummaryPrintActionButton>
      <DietSummaryModal
        open={dietSummaryModalShown}
        onClose={handleDietSummaryModalClose}
        printable
        width="md"
        area={area}
        data-testid="dietsummarymodal-p2vn"
      />
    </>
  );
});
