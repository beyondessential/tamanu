import React from 'react';
import styled from 'styled-components';

import { MEDICATION_ADMINISTRATION_TIME_SLOTS } from '@tamanu/constants';
import { useDateTime } from '@tamanu/ui-components';
import { MarDoseButton } from './MarDoseButton';
import MarDoseInfo from './MarDoseInfo';
import { getDosesPerSlot, getSubSlots } from './marTimeSlots';
import { MarDataCell, MarCellButton } from './components';
import { useIsCurrentTimeSlot } from './useIsCurrentTimeSlot';
import getShowDoseInfo from './getShowDoseInfo';

const DoseGrid = styled.div`
  --mar-cell-gap-rule: var(--mar-cell-gap-rule-width) solid ${p => p.theme.palette.divider};
  --mar-cell-gap-rule-width: 1px;
  block-size: 100%;
  column-rule: var(--mar-cell-gap-rule);
  display: grid;
  gap: var(--mar-cell-gap-rule-width);
  grid-template-columns: 1fr;
  inline-size: 100%;
  row-rule: var(--mar-cell-gap-rule);
  &:has(> ${MarCellButton}:nth-of-type(2)) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  &:has(> ${MarCellButton}:nth-of-type(4)) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(2, minmax(0, 1fr));
  }
`;

const DoseInfoOverlay = styled(MarDoseInfo)`
  inset: 0;
  pointer-events: none;
  position: absolute;
`;

export default function MarCell({
  selectedDate,
  timeSlot,
  marInfos,
  previousWindowMarInfos,
  nextWindowMarInfos,
  medication,
  pauseRecords,
  anchorEl,
  onAnchorElChange,
}) {
  const { getFacilityNowDate, toFacilityDateTime, storedDateTimeToEpochMilliseconds } =
    useDateTime();
  const facilityNow = getFacilityNowDate();

  const isCurrentTimeSlot = useIsCurrentTimeSlot({
    startTime: timeSlot.startTime,
    endTime: timeSlot.endTime,
    selectedDate,
  });

  const dosesPerSlot = getDosesPerSlot(medication?.frequency);
  const subSlots = getSubSlots(timeSlot, dosesPerSlot);
  const previousParentSlot = getParentTimeSlotForWindow(timeSlot, -1);
  const previousWindowSubSlots =
    previousWindowMarInfos && previousParentSlot
      ? getSubSlots(previousParentSlot, dosesPerSlot)
      : null;

  const showDoseInfo = marInfos.some((marInfo, index) => {
    const nextMarInfo =
      index < marInfos.length - 1 ? marInfos[index + 1] : (nextWindowMarInfos?.[0] ?? null);
    return getShowDoseInfo({
      marInfo,
      medication,
      timeSlot: subSlots[index],
      selectedDate,
      nextMarInfo,
      pauseRecords,
      now: facilityNow,
      toFacilityDateTime,
      storedDateTimeToEpochMilliseconds,
    });
  });

  const { doseAmount, dosingUnit, isVariableDose } = medication || {};

  return (
    <MarDataCell aria-current={isCurrentTimeSlot ? 'time' : undefined}>
      <DoseGrid>
        {subSlots.map((subSlot, index) => {
          const previousMarInfo =
            index > 0
              ? marInfos[index - 1]
              : (previousWindowMarInfos?.[previousWindowMarInfos.length - 1] ?? null);
          const nextMarInfo =
            index < marInfos.length - 1 ? marInfos[index + 1] : (nextWindowMarInfos?.[0] ?? null);
          const previousSubSlot =
            index > 0
              ? subSlots[index - 1]
              : (previousWindowSubSlots?.[previousWindowSubSlots.length - 1] ?? null);

          return (
            <MarDoseButton
              key={subSlot.startTime}
              selectedDate={selectedDate}
              timeSlot={subSlot}
              parentTimeSlot={timeSlot}
              marInfo={marInfos[index] ?? null}
              previousMarInfo={previousMarInfo}
              nextMarInfo={nextMarInfo}
              previousSubSlot={previousSubSlot}
              medication={medication}
              pauseRecords={pauseRecords}
              anchorEl={anchorEl}
              onAnchorElChange={onAnchorElChange}
            />
          );
        })}
      </DoseGrid>
      {showDoseInfo && (
        <DoseInfoOverlay
          doseAmount={doseAmount}
          dosingUnit={dosingUnit}
          isVariableDose={isVariableDose}
        />
      )}
    </MarDataCell>
  );
}

/**
 * Resolve an adjacent 2-hour window from the current one.
 * @param {{ startTime: string, endTime: string }} timeSlot
 * @param {-1 | 1} offset
 */
function getParentTimeSlotForWindow(timeSlot, offset) {
  const index = MEDICATION_ADMINISTRATION_TIME_SLOTS.findIndex(
    slot => slot.startTime === timeSlot.startTime,
  );
  return MEDICATION_ADMINISTRATION_TIME_SLOTS[index + offset] ?? null;
}
