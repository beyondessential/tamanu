import React from 'react';
import styled from 'styled-components';

import { MEDICATION_ADMINISTRATION_TIME_SLOTS } from '@tamanu/constants';
import { MarDoseButton } from './MarDoseButton';
import MarDoseInfoOverlay from './MarDoseInfoOverlay';
import { getDosesPerSlot, getSubSlots } from './marTimeSlots';
import { MarDataCell, MarCellButton } from './components';
import { useIsCurrentTimeSlot } from './useIsCurrentTimeSlot';

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

  return (
    <MarDataCell aria-current={isCurrentTimeSlot ? 'time' : undefined}>
      <DoseGrid>
        {subSlots.map((subSlot, i) => {
          const previousMarInfo =
            i > 0 ? marInfos[i - 1] : (previousWindowMarInfos?.at(-1) ?? null);
          const nextMarInfo =
            i < marInfos.length - 1 ? marInfos[i + 1] : (nextWindowMarInfos?.[0] ?? null);
          const previousSubSlot =
            i > 0 ? subSlots[i - 1] : (previousWindowSubSlots?.at(-1) ?? null);

          return (
            <MarDoseButton
              key={subSlot.startTime}
              selectedDate={selectedDate}
              timeSlot={subSlot}
              parentTimeSlot={timeSlot}
              marInfo={marInfos[i] ?? null}
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
      <MarDoseInfoOverlay
        marInfos={marInfos}
        subSlots={subSlots}
        dosesPerSlot={dosesPerSlot}
        medication={medication}
        selectedDate={selectedDate}
        pauseRecords={pauseRecords}
        nextWindowMarInfos={nextWindowMarInfos}
      />
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
