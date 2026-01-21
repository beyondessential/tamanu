import React from 'react';

import { Box } from '@mui/material';
import styled from 'styled-components';
import { DRUG_ROUTE_LABELS } from '@tamanu/constants';
import { DateDisplay, TranslatedReferenceData, TranslatedText, TimeDisplay } from '@tamanu/ui-components';
import { CheckSharp } from '@material-ui/icons';
import { getMedicationDoseDisplay, getTranslatedFrequency } from '@tamanu/shared/utils/medication';
import { Colors } from '../../constants';
import { useTranslation } from '../../contexts/Translation';

const MidText = styled(Box)`
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.midText};
`;

const DarkestText = styled(Box)`
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.darkestText};
`;

export const MedicationSummary = ({ medication }) => {
  const { getTranslation, getEnumTranslation } = useTranslation();

  return (
    <Box
      my={3}
      px={2.5}
      py={2}
      border={`1px solid ${Colors.outline}`}
      borderRadius={'3px'}
      bgcolor={Colors.white}
      display={'flex'}
      justifyContent={'space-between'}
    >
      <Box display={'flex'} flexDirection={'column'} gap={0.5}>
        <MidText>
          <TranslatedText stringId="medication.details.medication" fallback="Medication" />
        </MidText>
        <DarkestText fontWeight={500}>
          <TranslatedReferenceData
            fallback={medication.medication.name}
            value={medication.medication.id}
            category={medication.medication.type}
          />
        </DarkestText>
        <DarkestText>
          {[
            getMedicationDoseDisplay(medication, getTranslation, getEnumTranslation),
            getTranslatedFrequency(medication.frequency, getTranslation),
            getEnumTranslation(DRUG_ROUTE_LABELS, medication.route),
          ]
            .filter(Boolean)
            .join(', ')}
        </DarkestText>
        {medication.notes && <MidText>{medication.notes}</MidText>}
      </Box>
      <Box
        display={'flex'}
        flexDirection={'column'}
        justifyContent={'space-between'}
        alignItems={'flex-end'}
      >
        <Box display={'flex'}>
          {medication.isPrn && (
            <Box display={'flex'} alignItems={'center'} color={Colors.primary}>
              <CheckSharp style={{ fontSize: '18px' }} />
              <MidText ml={0.5}>
                <TranslatedText
                  stringId="medication.details.prnMedication"
                  fallback="PRN medication"
                />
              </MidText>
            </Box>
          )}
          {medication.isOngoing && (
            <Box ml={'5px'} display={'flex'} alignItems={'center'} color={Colors.primary}>
              <CheckSharp style={{ fontSize: '18px' }} />
              <MidText ml={0.5}>
                <TranslatedText
                  stringId="medication.details.ongoingMedication"
                  fallback="Ongoing medication"
                />
              </MidText>
            </Box>
          )}
        </Box>
        {medication.endDate && (
          <Box mt={3}>
            <MidText>
              <TranslatedText stringId="medication.details.endDate" fallback="End date & time" />
            </MidText>
            <DarkestText fontWeight={500} mt={0.5}>
              <DateDisplay date={medication.endDate} format="shortest" />{' '}
              <TimeDisplay date={medication.endDate} format="compact" noTooltip />
            </DarkestText>
          </Box>
        )}
      </Box>
    </Box>
  );
};
