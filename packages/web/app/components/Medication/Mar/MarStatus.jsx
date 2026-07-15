import React from 'react';
import styled from 'styled-components';

import { ADMINISTRATION_FREQUENCY_DETAILS } from '@tamanu/constants';
import MarDoseInfo from './MarDoseInfo';
import { MarDoseButton } from './MarDoseButton';
import { useIsCurrentTimeSlot } from './useIsCurrentTimeSlot';
import { useMarDoseState } from './useMarDoseState';
import TableCellButton from './TableCellButton';

const TableDataCell = styled.td`
  position: relative;
`;

const DoseGrid = styled.div`
  block-size: 100%;
  display: grid;
  grid-template-columns: 1fr;
  inline-size: 100%;
  &:has(> ${TableCellButton}:nth-of-type(2)) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  &:has(> ${TableCellButton}:nth-of-type(4)) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(2, minmax(0, 1fr));
  }
`;

const DoseInfoOverlay = styled(MarDoseInfo)`
  inset: 0;
  pointer-events: none;
  position: absolute;
`;

const getDosesPerSlot = frequency => {
  const dosesPerDay = ADMINISTRATION_FREQUENCY_DETAILS[frequency]?.dosesPerDay ?? 1;
  return Math.max(1, Math.round(dosesPerDay / 12));
};

export const MarStatus = ({
  selectedDate,
  timeSlot,
  marInfo,
  previousMarInfo,
  nextMarInfo,
  medication,
  pauseRecords,
  anchorEl,
  onAnchorElChange,
}) => {
  const isCurrentTimeSlot = useIsCurrentTimeSlot({
    startTime: timeSlot.startTime,
    endTime: timeSlot.endTime,
    selectedDate,
  });

  const { doseAmount, dosingUnit, isVariableDose, showDoseInfo } = useMarDoseState({
    selectedDate,
    timeSlot,
    marInfo,
    previousMarInfo,
    nextMarInfo,
    medication,
    pauseRecords,
  });

  const dosesPerSlot = getDosesPerSlot(medication?.frequency);

  return (
    <TableDataCell aria-current={isCurrentTimeSlot ? 'time' : undefined}>
      <DoseGrid>
        {Array.from({ length: dosesPerSlot }, (_, index) => (
          <MarDoseButton
            key={index}
            selectedDate={selectedDate}
            timeSlot={timeSlot}
            marInfo={index === 0 ? marInfo : null}
            previousMarInfo={previousMarInfo}
            nextMarInfo={nextMarInfo}
            medication={medication}
            pauseRecords={pauseRecords}
            anchorEl={anchorEl}
            onAnchorElChange={onAnchorElChange}
          />
        ))}
      </DoseGrid>
      {showDoseInfo && (
        <DoseInfoOverlay
          doseAmount={doseAmount}
          dosingUnit={dosingUnit}
          isVariableDose={isVariableDose}
        />
      )}
    </TableDataCell>
  );
};
