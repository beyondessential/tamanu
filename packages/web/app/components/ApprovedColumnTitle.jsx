import React from 'react';
import { Box } from '@mui/material';
import { TranslatedText } from './Translation/TranslatedText';
import { ThemedTooltip } from '@tamanu/ui-components';

export const ApprovedColumnTitle = () => {
  return (
    <ThemedTooltip
      title={
        <Box maxWidth="75px">
          <TranslatedText
            stringId="general.label.approved.tooltip"
            fallback="Approved by cashier"
          />
        </Box>
      }
    >
      <span>
        <TranslatedText stringId="general.label.approved" fallback="Approved" />
      </span>
    </ThemedTooltip>
  );
};
