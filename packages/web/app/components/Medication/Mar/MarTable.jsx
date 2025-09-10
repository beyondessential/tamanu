import React, { useLayoutEffect, useRef, useState, useCallback } from 'react';
import styled from 'styled-components';
import { MEDICATION_ADMINISTRATION_TIME_SLOTS } from '@tamanu/constants';
import { format, isSameDay } from 'date-fns';
import {
  getDateFromTimeString,
  findAdministrationTimeSlotFromIdealTime,
} from '@tamanu/shared/utils/medication';
import { toDateString } from '@tamanu/utils/dateTime';
import { TAMANU_COLORS, TranslatedText } from '@tamanu/ui-components';

import { useEncounter } from '../../../contexts/Encounter';
import { useEncounterMedicationQuery } from '../../../api/queries/useEncounterMedicationQuery';
import { MarTableRow } from './MarTableRow';

const MEDICATION_CELL_WIDTH = 48;

const HEADER_HEIGHT = 105;

const Container = styled.div`
  position: relative;
`;

const MedicationContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 221px);
  background-color: ${TAMANU_COLORS.white};
`;

// Header row for the time slots
const HeaderRow = styled.div`
  padding-right: 5px;
  display: grid;
  grid-template-columns: minmax(50px, 1fr) repeat(
      ${props => props.columns},
      ${MEDICATION_CELL_WIDTH}px
    );
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: ${TAMANU_COLORS.white};
`;

const ScrollableContent = styled.div`
  overflow-y: auto;
  overflow-x: hidden;
  ${p => (p.$flexShrink || p.$flexShrink === 0) && `flex-shrink: ${p.$flexShrink};`}
  /* Add these lines to handle scrollbar consistently across platforms */
  scrollbar-gutter: stable;

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${TAMANU_COLORS.softText};
    border-radius: 4px;
  }
`;

const HeadingCell = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  font-size: 16px;
  font-weight: 500;
  color: ${TAMANU_COLORS.darkestText};
  border-top: 1px solid ${TAMANU_COLORS.outline};
  border-left: 1px solid ${TAMANU_COLORS.outline};
  height: 100%;
`;

const TimeSlotHeaderContainer = styled.div`
  padding: 24px 0px 10px 0px;
  height: ${HEADER_HEIGHT}px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-top: 1px solid ${TAMANU_COLORS.outline};
  border-left: 1px solid ${TAMANU_COLORS.outline};
  ${props =>
    props.isCurrentTimeSlot
      ? `background: #EBF0F5; color: ${TAMANU_COLORS.primary};`
      : `color: ${TAMANU_COLORS.midText};`}
`;

const TimeSlotText = styled.div`
  font-weight: 400;
  font-size: 12px;
  transform: rotate(-90deg);
  white-space: nowrap;
`;

const TimeSlotLabel = styled.div`
  text-transform: capitalize;
  color: ${TAMANU_COLORS.darkestText};
`;

const SubHeader = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${TAMANU_COLORS.midText};
  padding: 10px 8px;
  border-top: 1px solid ${TAMANU_COLORS.outline};
  border-left: 1px solid ${TAMANU_COLORS.outline};
  border-bottom: 1px solid ${TAMANU_COLORS.outline};
  grid-column: 1 / -1;
  position: sticky;
  top: 0;
  z-index: 5;
  background-color: ${TAMANU_COLORS.white};
`;

const EmptyMessage = styled.div`
  color: ${TAMANU_COLORS.darkestText};
  font-size: 14px;
  font-weight: 500;
  padding: 10px 8px;
  border-top: 1px solid ${TAMANU_COLORS.outline};
  border-left: 1px solid ${TAMANU_COLORS.outline};
  grid-column: 1 / -1;
`;

const MedicationGrid = styled.div`
  display: grid;
  margin-top: -1px;
  grid-template-columns: minmax(50px, 1fr) repeat(12, ${MEDICATION_CELL_WIDTH}px);
`;

const CurrentTimeOverlay = styled.div`
  position: absolute;
  top: 0;
  width: ${MEDICATION_CELL_WIDTH - 1}px;
  height: ${p => p.$height || '100%'};
  z-index: 11;
  right: ${p => (p.$length - p.$index - 1) * MEDICATION_CELL_WIDTH + 5}px;
  border: 1px solid ${TAMANU_COLORS.primary};
  pointer-events: none;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  border-left: 1px solid ${TAMANU_COLORS.outline};
  height: 42px;
`;

const formatTime = time => {
  return format(time, 'ha').toLowerCase();
};

const TimeSlotHeader = ({ periodLabel, startTime, endTime, selectedDate }) => {
  const startDate = getDateFromTimeString(startTime).getTime();
  const endDate = getDateFromTimeString(endTime).getTime();
  const isCurrentTimeSlot =
    startDate <= Date.now() && Date.now() <= endDate && isSameDay(selectedDate, new Date());

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
  const scheduledSectionRef = useRef(null);
  const scheduledHeaderRef = useRef(null);
  const prnSectionRef = useRef(null);
  const prnHeaderRef = useRef(null);
  const scrollableContentRef = useRef(null);
  const [overlayHeight, setOverlayHeight] = useState('100%');
  const [popperAnchorEl, setPopperAnchorEl] = useState(null);

  const { data: medicationsData, isLoading: isLoadingMedications } = useEncounterMedicationQuery(
    encounter?.id,
    {
      marDate: toDateString(selectedDate),
      orderBy: 'date',
      order: 'asc',
    },
  );
  const medications = (medicationsData?.data || []).sort((a, b) => {
    if (a.discontinued === b.discontinued) {
      return 0;
    }
    return a.discontinued ? 1 : -1;
  });
  const prnMedications = medications.filter(medication => medication.isPrn);
  const scheduledMedications = medications.filter(medication => !medication.isPrn);

  // Determine overlay height based on medication content and visibility
  const calculateAndSetOverlayHeight = useCallback(() => {
    const scrollableContainer = scrollableContentRef.current;
    const scheduledSection = scheduledSectionRef.current;

    if (prnMedications.length > 0) {
      setOverlayHeight('100%');
      return;
    }

    if (scheduledMedications.length > 0 && scrollableContainer && scheduledSection) {
      const scrollableRect = scrollableContainer.getBoundingClientRect();
      const scheduledRect = scheduledSection.getBoundingClientRect();

      // Calculate the visible height of the scheduled medications
      const visibleTop = Math.max(scrollableRect.top, scheduledRect.top);
      const visibleBottom = Math.min(scrollableRect.bottom, scheduledRect.bottom);
      const visibleScheduledHeight = Math.max(0, visibleBottom - visibleTop);

      setOverlayHeight(`calc(${HEADER_HEIGHT}px + ${visibleScheduledHeight}px)`);
      return;
    }

    // Only header is visible or no scheduled meds
    setOverlayHeight(`${HEADER_HEIGHT}px`);
  }, [prnMedications.length, scheduledMedications.length]);

  // Recalculate on mount, or selectedDate change
  useLayoutEffect(() => {
    calculateAndSetOverlayHeight();
  }, [calculateAndSetOverlayHeight, selectedDate]);

  // Add/Remove Scroll Listener
  useLayoutEffect(() => {
    const scrollableElement = scrollableContentRef?.current;

    if (!scrollableElement) return;

    // Add listener only if we need dynamic height (no PRN meds)
    if (prnMedications.length === 0 && scheduledMedications.length > 0) {
      scrollableElement.addEventListener('scroll', calculateAndSetOverlayHeight);

      // Initial calculation after layout
      calculateAndSetOverlayHeight();

      return () => {
        scrollableElement.removeEventListener('scroll', calculateAndSetOverlayHeight);
      };
    } else {
      // Ensure correct height is set if conditions change (e.g., PRN meds added/removed)
      calculateAndSetOverlayHeight();
    }
    // No cleanup needed if listener wasn't added
    return undefined;
  }, [prnMedications.length, scheduledMedications.length, calculateAndSetOverlayHeight]);

  // Effect for sticky headers
  useLayoutEffect(() => {
    // Don't proceed if any required refs are missing
    if (!scheduledHeaderRef.current || !prnHeaderRef.current) return;

    const scheduledHeader = scheduledHeaderRef.current;
    const prnHeader = prnHeaderRef.current;

    // Common observer configuration
    const observerOptions = {
      threshold: 0,
      rootMargin: `-${HEADER_HEIGHT}px 0px 0px 0px`,
    };

    // Helper function to create consistent observers
    const createHeaderObserver = headerElement => {
      return new IntersectionObserver(([entry]) => {
        headerElement.style.position = entry.isIntersecting
          ? 'sticky'
          : entry.boundingClientRect.top < HEADER_HEIGHT
          ? 'static'
          : headerElement.style.position;
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
          $index={findAdministrationTimeSlotFromIdealTime(new Date()).index}
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
            selectedDate={selectedDate}
          />
        ))}
      </HeaderRow>
      <MedicationContainer>
        <ScrollableContent ref={scrollableContentRef}>
          {/* Scheduled medications section */}
          <div ref={scheduledSectionRef}>
            <SubHeader ref={scheduledHeaderRef}>
              <TranslatedText
                fallback="Scheduled medication"
                stringId="medication.mar.scheduledMedication.label"
              />
            </SubHeader>
            {isLoadingMedications ? (
              <LoadingContainer>
                <TranslatedText
                  stringId="general.table.loading"
                  fallback="Loading..."
                  data-testid="translatedtext-yvlt"
                />
              </LoadingContainer>
            ) : (
              <MedicationGrid>
                {scheduledMedications.length ? (
                  scheduledMedications.map(medication => (
                    <MarTableRow
                      key={medication?.id}
                      medication={medication}
                      selectedDate={selectedDate}
                      popperAnchorEl={popperAnchorEl}
                      onPopperAnchorElChange={setPopperAnchorEl}
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
            )}
          </div>

          {/* PRN medications section */}
          <div ref={prnSectionRef}>
            <SubHeader ref={prnHeaderRef}>
              <TranslatedText
                fallback="PRN medication"
                stringId="medication.mar.prnMedication.label"
              />
            </SubHeader>
            {isLoadingMedications ? (
              <LoadingContainer>
                <TranslatedText
                  stringId="general.table.loading"
                  fallback="Loading..."
                  data-testid="translatedtext-yvlt"
                />
              </LoadingContainer>
            ) : (
              <MedicationGrid>
                {prnMedications.length ? (
                  prnMedications.map(medication => (
                    <MarTableRow
                      key={medication?.id}
                      medication={medication}
                      selectedDate={selectedDate}
                      popperAnchorEl={popperAnchorEl}
                      onPopperAnchorElChange={setPopperAnchorEl}
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
            )}
          </div>
        </ScrollableContent>
      </MedicationContainer>
    </Container>
  );
};
