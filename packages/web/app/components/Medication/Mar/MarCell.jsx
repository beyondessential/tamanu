import React from 'react';
import styled from 'styled-components';

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

  return (
    <MarDataCell aria-current={isCurrentTimeSlot ? 'time' : undefined}>
      <DoseGrid>
        {subSlots.map((subSlot, i) => {
          const nextMarInfo =
            i < marInfos.length - 1 ? marInfos[i + 1] : (nextWindowMarInfos?.[0] ?? null);

          return (
            <MarDoseButton
              key={subSlot.startTime}
              selectedDate={selectedDate}
              timeSlot={subSlot}
              parentTimeSlot={timeSlot}
              marInfo={marInfos[i] ?? null}
              nextMarInfo={nextMarInfo}
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
