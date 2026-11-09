import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { Button } from '@material-ui/core';
import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined';
import { Colors } from '../../constants';
import { TranslatedText } from '../Translation/TranslatedText';
import { DietSummaryModal } from './DietSummaryModal';

const PrintActionButton = styled(Button)`
  font-weight: 500;
  text-transform: none;
  text-decoration: underline;
  color: ${Colors.primary};
  margin-top: auto;
  margin-bottom: auto;
  &:hover {
    text-decoration: underline;
  }
  &.Mui-disabled {
    pointer-events: auto;
  }
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
        printable
        width="md"
        area={area}
        data-testid="dietsummarymodal-p2vn"
      />
    </>
  );
});
