import { Box } from '@material-ui/core';
import React from 'react';
import styled from 'styled-components';

import { DateDisplay, ThemedTooltip, TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../../constants';

const NoWrapBox = styled(Box)`
  white-space: nowrap;
`;

export const LastSentCell = ({ lastOrderedAt, isLastOrderDispensed }) => {
  if (!lastOrderedAt) {
    return (
      <NoWrapBox>
        <TranslatedText stringId="general.fallback.notApplicable" fallback="N/A" casing="lower" />
      </NoWrapBox>
    );
  }

  return (
    <NoWrapBox>
      <ThemedTooltip
        title={<DateDisplay date={lastOrderedAt} format="short" timeFormat="default" noTooltip />}
      >
        <Box>
          <DateDisplay date={lastOrderedAt} format="shortest" noTooltip />
          <Box fontSize="12px" color={Colors.midText}>
            {isLastOrderDispensed ? (
              <TranslatedText
                stringId="medication.pharmacyRequest.status.dispensed"
                fallback="Dispensed"
              />
            ) : (
              <TranslatedText
                stringId="medication.pharmacyRequest.status.activeRequest"
                fallback="Active request"
              />
            )}
          </Box>
        </Box>
      </ThemedTooltip>
    </NoWrapBox>
  );
};
