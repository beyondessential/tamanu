import { Box } from '@material-ui/core';
import React, { useLayoutEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { DRUG_ROUTE_LABELS, MEDICATION_ADMINISTRATION_TIME_SLOTS } from '@tamanu/constants';
import { Colors } from '../../../constants';
import { TranslatedEnum, TranslatedReferenceData, TranslatedText } from '../../../components';
import { useEncounter } from '../../../contexts/Encounter';
import { useEncounterMedicationQuery } from '../../../api/queries/useEncounterMedicationQuery';
import { format, isSameDay } from 'date-fns';
import {
  findAdministrationTimeSlotFromIdealTime,
  getDateFromTimeString,
} from '@tamanu/shared/utils/medication';
import { getDose, getTranslatedFrequency } from '../../../utils/medications';
import { useTranslation } from '../../../contexts/Translation';

const MEDICATION_CELL_WIDTH = 48;

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
  grid-template-columns: minmax(100px, 1fr) repeat(
      ${props => props.columns},
      ${MEDICATION_CELL_WIDTH}px
    );
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: ${Colors.white};
`;

const ScrollableContent = styled.div`
  overflow-y: auto;
  overflow-x: hidden;
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
  grid-column: 1 / -1;
  position: sticky;
  top: 0px;
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
  grid-template-columns: minmax(100px, 1fr) repeat(12, ${MEDICATION_CELL_WIDTH}px);
  margin-top: -1px;
`;

const CurrentTimeOverlay = styled.div`
  position: absolute;
  top: 0;
  width: ${MEDICATION_CELL_WIDTH - 1}px;
  height: ${p => p.$height || '100%'};
  z-index: 11;
  right: ${p => (p.$length - p.$index - 1) * MEDICATION_CELL_WIDTH}px;
  border: 1px solid ${Colors.primary};
`;

const formatTime = time => {
  return format(time, 'ha').toLowerCase();
};

const MedicationCell = ({ medication }) => {
  const { frequency, route, notes, medication: medicationRef, discontinued } = medication;
  const { getTranslation, getEnumTranslation } = useTranslation();

  return (
    <>
      <MedicationCellContainer discontinued={discontinued}>
        <Box fontWeight={500}>
          <TranslatedReferenceData
            fallback={medicationRef.name}
            value={medicationRef.id}
            category={medicationRef.type}
          />
        </Box>
        <Box>
          {getDose(medication, getTranslation, getEnumTranslation)},{' '}
          {getTranslatedFrequency(frequency, getTranslation)},{' '}
          {<TranslatedEnum value={route} enumValues={DRUG_ROUTE_LABELS} />}
        </Box>
        <Box color={Colors.midText}>{notes}</Box>
      </MedicationCellContainer>
      {MEDICATION_ADMINISTRATION_TIME_SLOTS.map(({ startTime }) => (
        <StatusCell key={startTime} />
      ))}
    </>
  );
};

const TimeSlotHeader = ({ periodLabel, startTime, endTime }) => {
  const startDate = getDateFromTimeString(startTime).getTime();
  const endDate = getDateFromTimeString(endTime).getTime();
  const isCurrentTimeSlot = startDate <= Date.now() && Date.now() <= endDate;

  return (
    <TimeSlotHeaderContainer isCurrentTimeSlot={isCurrentTimeSlot}>
      <TimeSlotText>
        <TimeSlotLabel>{periodLabel || ''}</TimeSlotLabel>
        <div>{`${formatTime(startDate)} - ${formatTime(endDate)}`}</div>
      </TimeSlotText>
    </TimeSlotHeaderContainer>
  );
};

export const MarTable = ({ selectedDate }) => {
  const { encounter } = useEncounter();
  const scheduledSectionRef = useRef();
  const prnSectionRef = useRef();
  const scheduledHeaderRef = useRef();
  const prnHeaderRef = useRef();
  const [overlayHeight, setOverlayHeight] = useState('100%');

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

  // Determine overlay height based on medication content
  const getOverlayHeight = () => {
    if (prnMedications.length > 0) {
      setOverlayHeight('100%');
      return;
    }
    if (scheduledMedications.length > 0) {
      const scheduledSectionHeight = scheduledSectionRef?.current?.offsetHeight || 0;
      setOverlayHeight('calc(105px + ' + scheduledSectionHeight + 'px)');
      return;
    }
    setOverlayHeight('105px');
  };

  useLayoutEffect(() => {
    getOverlayHeight();
  }, [prnMedications.length, scheduledMedications.length, selectedDate]);

  useLayoutEffect(() => {
    // Don't proceed if any required refs are missing
    if (!scheduledHeaderRef.current || !prnHeaderRef.current) return;

    const scheduledHeader = scheduledHeaderRef.current;
    const prnHeader = prnHeaderRef.current;
    
    // Common observer configuration
    const observerOptions = { 
      threshold: 0, 
      rootMargin: '-105px 0px 0px 0px' 
    };
    
    // Helper function to create consistent observers
    const createHeaderObserver = headerElement => {
      return new IntersectionObserver(([entry]) => {
        headerElement.style.position = entry.isIntersecting 
          ? 'sticky' 
          : (entry.boundingClientRect.top < 105 ? 'static' : headerElement.style.position);
      }, observerOptions);
    };

    // Create observers for both section headers
    const scheduledObserver = createHeaderObserver(scheduledHeader);
    const prnObserver = createHeaderObserver(prnHeader);

    // Start observing sections if they exist
    if (scheduledSectionRef.current) scheduledObserver.observe(scheduledSectionRef.current);
    if (prnSectionRef.current) prnObserver.observe(prnSectionRef.current);

    // Clean up observers when component unmounts
    return () => {
      scheduledObserver.disconnect();
      prnObserver.disconnect();
    };
  }, []);

  return (
    <Container>
      {isSameDay(selectedDate, new Date()) && (
        <CurrentTimeOverlay
          $index={
            findAdministrationTimeSlotFromIdealTime(
              `${format(new Date(), 'HH')}:${format(new Date(), 'mm')}`,
            ).index
          }
          $length={MEDICATION_ADMINISTRATION_TIME_SLOTS.length}
          $height={overlayHeight}
        />
      )}
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
          />
        ))}
      </HeaderRow>
      <MedicationContainer>
        <ScrollableContent>
          {/* Scheduled medications section */}
          <div ref={scheduledSectionRef}>
            <SubHeader ref={scheduledHeaderRef}>
              <TranslatedText
                fallback="Scheduled medication"
                stringId="medication.mar.scheduledMedication.label"
              />
            </SubHeader>
            <MedicationGrid>
              {scheduledMedications.length ? (
                scheduledMedications.map(medication => (
                  <MedicationCell
                    key={medication?.id}
                    medication={medication}
                    selectedDate={selectedDate}
                  />
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
          </div>

          {/* PRN medications section */}
          <div ref={prnSectionRef}>
            <SubHeader ref={prnHeaderRef}>
              <TranslatedText
                fallback="PRN medication"
                stringId="medication.mar.prnMedication.label"
              />
            </SubHeader>
            <MedicationGrid>
              {prnMedications.length ? (
                prnMedications.map(medication => (
                  <MedicationCell
                    key={medication?.id}
                    medication={medication}
                    selectedDate={selectedDate}
                  />
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
          </div>
        </ScrollableContent>
      </MedicationContainer>
    </Container>
  );
};
