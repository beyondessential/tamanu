import React, { useCallback, useState } from 'react';
import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined';
import { Colors } from '../../constants';
import { TranslatedText } from '../Translation/TranslatedText';
import { DietSummaryModal } from './DietSummaryModal';
import { PrintActionButton } from './PrintActionButton';

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
      <PrintActionButton
        startIcon={<InsertChartOutlinedIcon htmlColor={Colors.primary} />}
        onClick={handleDietSummaryButtonClick}
        data-testid="dietsummarybutton-x3qa"
      >
        <TranslatedText
          stringId="bedManagement.search.dietSummary.button.label"
          fallback="Diet summary"
          data-testid="translatedtext-dietsummary"
        />
      </PrintActionButton>
      <DietSummaryModal
        open={dietSummaryModalShown}
        onClose={handleDietSummaryModalClose}
        width="md"
        area={area}
        data-testid="dietsummarymodal-p2vn"
      />
    </>
  );
});
