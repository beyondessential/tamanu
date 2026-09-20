import { Box } from '@material-ui/core';
import React from 'react';
import styled from 'styled-components';

import { DateDisplay, ThemedTooltip, TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../../constants';

const NoWrapBox = styled(Box)`
  white-space: nowrap;
`;

/**
 * Shows when a medication was sent to pharmacy and the state of that request. Which request the
 * date refers to differs by table — the discharge modal passes its most recent send, while the
 * encounter and send-to-pharmacy tables pass the request awaiting action — so callers pass the
 * resolved values rather than the cell choosing between them.
 */
export const LastSentCell = ({ sentAt, isDispensed }) => {
  if (!sentAt) {
    return (
      <NoWrapBox>
        <TranslatedText stringId="general.fallback.notApplicable" fallback="N/A" casing="lower" />
      </NoWrapBox>
    );
  }

  return (
    <NoWrapBox>
      <ThemedTooltip
        title={<DateDisplay date={sentAt} format="short" timeFormat="default" noTooltip />}
      >
        <Box>
          <DateDisplay date={sentAt} format="shortest" noTooltip />
          <Box fontSize="12px" color={Colors.midText}>
            {isDispensed ? (
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
