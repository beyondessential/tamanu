import { Box } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { DRUG_ROUTE_LABELS, MEDICATION_ADMINISTRATION_TIME_SLOTS } from '@tamanu/constants';
import { Colors } from '../../../constants';
import { TranslatedText } from '../../../components';
import { useEncounter } from '../../../contexts/Encounter';
import { useEncounterMedicationQuery } from '../../../api/queries/useEncounterMedicationQuery';
import { format, parse } from 'date-fns';
import { getDateFromTimeString } from '@tamanu/shared/utils/medication';

const Container = styled.div`
  position: relative;
`;

const MedicationContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 221px);
  background-color: ${Colors.white};
`;

// Header row for the time slots
const HeaderRow = styled.div`
  display: grid;
  grid-template-columns: minmax(100px, 1fr) repeat(${props => props.columns}, 48px);
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: ${Colors.white};
`;

const ScrollableContent = styled.div`
  overflow-y: auto;
  ${p => (p.$flexShrink || p.$flexShrink === 0) && `flex-shrink: ${p.$flexShrink};`}
`;

const HeadingCell = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  font-size: 16px;
  font-weight: 500;
  color: ${Colors.darkestText};
  border-top: 1px solid ${Colors.outline};
  border-left: 1px solid ${Colors.outline};
  height: 100%;
`;

const TimeSlotHeaderContainer = styled.div`
  padding: 24px 0px 10px 0px;
  height: 105px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-top: 1px solid ${Colors.outline};
  border-left: 1px solid ${Colors.outline};
  ${props => props.isCurrentTimeSlot && `background: #EBF0F5; color: ${Colors.primary};`}
`;

const TimeSlotText = styled.div`
  font-weight: 400;
  font-size: 12px;
  transform: rotate(-90deg);
  white-space: nowrap;
  color: ${Colors.midText};
`;

const TimeSlotLabel = styled.div`
  text-transform: capitalize;
  color: ${Colors.darkestText};
`;

const SubHeader = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${Colors.midText};
  padding: 10px 8px;
  border-top: 1px solid ${Colors.outline};
  border-left: 1px solid ${Colors.outline};
  border-bottom: 1px solid ${Colors.outline};
  margin-top: -1px;
  grid-column: 1 / -1;
  position: sticky;
  top: 0;
  z-index: 5;
  background-color: ${Colors.white};
`;

const EmptyMessage = styled.div`
  color: ${Colors.darkestText};
  font-size: 14px;
  font-weight: 500;
  padding: 10px 8px;
  border-top: 1px solid ${Colors.outline};
  border-left: 1px solid ${Colors.outline};
  grid-column: 1 / -1;
`;

const MedicationCellContainer = styled.div`
  padding: 8px 12px;
  font-size: 14px;
  border-top: 1px solid ${Colors.outline};
  border-left: 1px solid ${Colors.outline};
  ${props => props.discontinued && `text-decoration: line-through;`}
`;

const StatusCell = styled.div`
  border-top: 1px solid ${Colors.outline};
  border-left: 1px solid ${Colors.outline};
`;

const MedicationGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(100px, 1fr) repeat(12, 48px);
`;

const CurrentTimeOverlay = styled.div`
  position: absolute;
  top: 0;
  width: 48px;
  height: 100%;
  z-index: 11;
  right: ${p => (p.$length - p.$index - 1) * 48}px;
  border: 1px solid ${Colors.primary};
`;

const formatTime = time => {
  return format(parse(time, 'HH:mm', new Date()), 'ha').toLowerCase();
};

const MedicationCell = ({
  id,
  isPrn,
  doseAmount,
  units,
  frequency,
  route,
  notes,
  medication,
  discontinued,
}) => {
  const doseAmountDisplay = isPrn ? (
    <TranslatedText stringId="medication.table.variable" fallback="Variable" />
  ) : (
    doseAmount
  );
  return (
    <React.Fragment key={id}>
      <MedicationCellContainer discontinued={discontinued}>
        <Box fontWeight={500}>{medication.name}</Box>
        <Box>
          <span>{doseAmountDisplay}</span>
          <span>{` ${units}, ${frequency}, ${DRUG_ROUTE_LABELS[route]}`}</span>
        </Box>
        <Box color={Colors.midText}>{notes}</Box>
      </MedicationCellContainer>
      {MEDICATION_ADMINISTRATION_TIME_SLOTS.map(({ startTime }) => (
        <StatusCell key={startTime} />
      ))}
    </React.Fragment>
  );
};

const TimeSlotHeader = ({ periodLabel, startTime, endTime, index, setCurrentTimeSlotIndex }) => {
  const startDate = getDateFromTimeString(startTime).getTime();
  const endDate = getDateFromTimeString(endTime).getTime();
  const isCurrentTimeSlot = startDate <= Date.now() && Date.now() <= endDate;

  useEffect(() => {
    if (isCurrentTimeSlot) {
      setCurrentTimeSlotIndex(index);
    }
  }, [index, isCurrentTimeSlot, setCurrentTimeSlotIndex]);

  return (
    <TimeSlotHeaderContainer isCurrentTimeSlot={isCurrentTimeSlot}>
      <TimeSlotText>
        <TimeSlotLabel>{periodLabel || ''}</TimeSlotLabel>
        <div>{`${formatTime(startTime)} - ${formatTime(endTime)}`}</div>
      </TimeSlotText>
    </TimeSlotHeaderContainer>
  );
};

export const MarTable = ({ selectedDate }) => {
  const { encounter } = useEncounter();
  const [currentTimeSlotIndex, setCurrentTimeSlotIndex] = useState(-1);

  const medications = (
    useEncounterMedicationQuery(encounter?.id, { after: selectedDate }).data?.data || []
  ).sort((a, b) => {
    if (a.discontinued === b.discontinued) {
      return 0;
    }
    return a.discontinued ? 1 : -1;
  });
  const prnMedications = medications.filter(medication => medication.isPrn);
  const scheduledMedications = medications.filter(medication => !medication.isPrn);

  return (
    <Container>
      <CurrentTimeOverlay
        $index={currentTimeSlotIndex}
        $length={MEDICATION_ADMINISTRATION_TIME_SLOTS.length}
      />
      <HeaderRow columns={MEDICATION_ADMINISTRATION_TIME_SLOTS.length}>
        <HeadingCell>
          <TranslatedText fallback="Medication" stringId="medication.mar.medication.label" />
        </HeadingCell>
        {MEDICATION_ADMINISTRATION_TIME_SLOTS.map(({ periodLabel, startTime, endTime }, index) => (
          <TimeSlotHeader
            key={startTime}
            periodLabel={periodLabel}
            startTime={startTime}
            endTime={endTime}
            index={index}
            setCurrentTimeSlotIndex={setCurrentTimeSlotIndex}
          />
        ))}
      </HeaderRow>
      <MedicationContainer>
        <ScrollableContent $flexShrink={!scheduledMedications.length ? 0 : null}>
          <SubHeader>
            <TranslatedText
              fallback="Scheduled medication"
              stringId="medication.mar.scheduledMedication.label"
            />
          </SubHeader>
          <MedicationGrid>
            {scheduledMedications.length ? (
              scheduledMedications.map(medication => (
                <MedicationCell key={medication?.id} {...medication} />
              ))
            ) : (
              <EmptyMessage>
                <TranslatedText
                  fallback="No scheduled medication to display"
                  stringId="medication.mar.noScheduledMedication.label"
                />
              </EmptyMessage>
            )}
          </MedicationGrid>
        </ScrollableContent>
        {/* PRN medications section */}
        <ScrollableContent $flexShrink={!prnMedications.length ? 0 : null}>
          <SubHeader>
            <TranslatedText
              fallback="PRN medication"
              stringId="medication.mar.prnMedication.label"
            />
          </SubHeader>
          <MedicationGrid>
            {prnMedications.length ? (
              prnMedications.map(medication => (
                <MedicationCell key={medication?.id} {...medication} />
              ))
            ) : (
              <EmptyMessage>
                <TranslatedText
                  fallback="No PRN medication to display"
                  stringId="medication.mar.noPrnMedication.label"
                />
              </EmptyMessage>
            )}
          </MedicationGrid>
        </ScrollableContent>
      </MedicationContainer>
    </Container>
  );
};
