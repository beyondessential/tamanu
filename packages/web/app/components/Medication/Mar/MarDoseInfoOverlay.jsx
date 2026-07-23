import React from 'react';
import styled from 'styled-components';

import { useDateTime } from '@tamanu/ui-components';
import MarDoseInfoText from './MarDoseInfoText';
import getShowDoseInfo, { hasVisibleMarStatusIcon } from './getShowDoseInfo';
import { getIsPast } from './useMarDoseTiming';
import { getIsDiscontinued, getIsEnd, getIsPaused } from './useMarStatusFlags';

const Div = styled.div`
  display: grid;
  inset: 0;
  place-items: center;
  pointer-events: none;
  position: absolute;
  text-align: center;
  text-wrap: balance;
`;

/**
 * @param {{
 *   marInfos: any[];
 *   subSlots: { startTime: string, endTime: string }[];
 *   dosesPerSlot: number;
 *   medication?: object | null;
 *   selectedDate: Date;
 *   pauseRecords?: { data?: any[] };
 *   nextWindowMarInfos?: any[] | null;
 * }} props
 */
export default function MarDoseInfoOverlay({
  marInfos,
  subSlots,
  dosesPerSlot,
  medication,
  selectedDate,
  pauseRecords,
  nextWindowMarInfos,
}) {
  const { getFacilityNowDate, toFacilityDateTime, storedDateTimeToEpochMilliseconds } =
    useDateTime();
  const facilityNow = getFacilityNowDate();
  const { doseAmount, dosingUnit, isVariableDose, isPrn, discontinuedDate, endDate } =
    medication || {};

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

  if (!showDoseInfo) return null;

  const hidden =
    dosesPerSlot > 1 &&
    subSlots.some((subSlot, i) => {
      const marInfo = marInfos[i] ?? null;
      const nextMarInfo =
        i < marInfos.length - 1 ? marInfos[i + 1] : (nextWindowMarInfos?.[0] ?? null);
      const { recordedAt, dueAt } = marInfo || {};

      return hasVisibleMarStatusIcon({
        marInfo,
        isDiscontinued: getIsDiscontinued({
          discontinuedDate,
          dueAt,
          isRecordedStatus: Boolean(recordedAt),
          timeSlot: subSlot,
          selectedDate,
          nextMarInfo,
          toFacilityDateTime,
          storedDateTimeToEpochMilliseconds,
        }),
        isEnd: getIsEnd({
          endDate,
          hasRecord: Boolean(marInfo),
          timeSlot: subSlot,
          selectedDate,
          toFacilityDateTime,
        }),
        isPast: getIsPast({ timeSlot: subSlot, selectedDate, now: facilityNow }),
        isPaused: getIsPaused({
          pauseRecords: pauseRecords?.data,
          timeSlot: subSlot,
          selectedDate,
          recordedAt,
          toFacilityDateTime,
        }),
        isPrn,
      });
    });

  return (
    <Div style={hidden ? { visibility: 'hidden' } : undefined}>
      <MarDoseInfoText
        doseAmount={doseAmount}
        dosingUnit={dosingUnit}
        isVariableDose={isVariableDose}
      />
    </Div>
  );
}
