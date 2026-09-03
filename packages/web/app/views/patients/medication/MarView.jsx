import { addDays, isValid, parse, startOfDay } from 'date-fns';
import React, { useCallback, useEffect, useState } from 'react';
import { generatePath, matchPath, useLocation, useNavigate, useParams } from 'react-router';

import { useDateTime } from '@tamanu/ui-components';
import { toDateString } from '@tamanu/utils/dateTime';
import { MarHeader } from '../../../components/Medication/Mar/MarHeader';
import { MarTable } from '../../../components/Medication/Mar/MarTable';
import { PATIENT_PATHS } from '../../../constants/patientPaths';
import { useEncounter } from '../../../contexts/Encounter';

const MAR_VIEW_PATH = `${PATIENT_PATHS.MAR}/view/:date`;

// Strict ISO 8601 calendar date, e.g. 2026-08-05 but not 2026-8-5
const DATE_PARAM_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parseDateParam = dateParam => {
  if (!dateParam || !DATE_PARAM_PATTERN.test(dateParam)) return null;
  const parsed = parse(dateParam, 'yyyy-MM-dd', new Date());
  return isValid(parsed) ? parsed : null;
};

/**
 * Re-render every minute so highlights and disabled states derived from facility "now"
 * (recomputed on render throughout the MAR) stay fresh.
 */
const useMinuteTick = () => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(tick => tick + 1), 60_000);
    return () => clearInterval(timer);
  }, []);
};

/**
 * The `:date` route param (strict `yyyy-MM-dd`) is the source of truth for the selected date.
 * A missing, malformed, or out-of-range param replace-redirects to the default date, while
 * `setSelectedDate` pushes a history entry so the back button walks through viewed dates.
 *
 * @returns {[Date | null, (date: Date) => void]} Selected facility calendar day (midnight),
 * `null` for the single frame before the redirect lands.
 */
const useMarDate = () => {
  const { date: dateParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { encounter } = useEncounter();
  const { getFacilityNowDate, toFacilityDateTime } = useDateTime();

  useMinuteTick();

  const toFacilityDate = dateStr => {
    if (!dateStr) return null;
    const converted = toFacilityDateTime(dateStr);
    return converted ? new Date(converted) : null;
  };

  const navigateToDateString = useCallback(
    (dateString, options) => {
      const params =
        matchPath({ path: PATIENT_PATHS.ENCOUNTER, end: false }, location.pathname)?.params ?? {};
      navigate(generatePath(MAR_VIEW_PATH, { ...params, date: dateString }), options);
    },
    [navigate, location.pathname],
  );

  const setSelectedDate = useCallback(
    date => navigateToDateString(toDateString(date)),
    [navigateToDateString],
  );

  const facilityNow = getFacilityNowDate();
  const encounterStart = toFacilityDate(encounter?.startDate);
  const encounterEnd = toFacilityDate(encounter?.endDate);

  // Bounds match the stepper limits in MarHeader
  const latestAllowed =
    encounterEnd && encounterEnd < addDays(facilityNow, 2) ? encounterEnd : addDays(facilityNow, 2);
  const minDate = encounterStart ? startOfDay(encounterStart) : null;
  const maxDate = startOfDay(latestAllowed);

  const parsedDate = parseDateParam(dateParam);
  const isInRange = parsedDate && (!minDate || parsedDate >= minDate) && parsedDate <= maxDate;
  const selectedDate = isInRange ? parsedDate : null;

  const defaultDate = encounterEnd && encounterEnd < facilityNow ? encounterEnd : facilityNow;
  const defaultDateString = toDateString(defaultDate);
  const isValid = Boolean(selectedDate);

  useEffect(() => {
    if (isValid) return;
    navigateToDateString(defaultDateString, { replace: true });
  }, [isValid, defaultDateString, navigateToDateString]);

  return [selectedDate, setSelectedDate];
};

export const MarView = () => {
  const [date, setDate] = useMarDate();

  if (!date) return null; // Redirecting to the default date

  return (
    <div>
      <MarHeader selectedDate={date} onDateChange={setDate} />
      <MarTable selectedDate={date} />
    </div>
  );
};
