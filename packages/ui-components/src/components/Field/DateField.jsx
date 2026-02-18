import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import Popper from '@mui/material/Popper';
import Button from '@mui/material/Button';
import KeyboardArrowLeftIcon from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import { Box } from '@material-ui/core';
import { addDays, isValid, isSameDay, parse, startOfToday } from 'date-fns';

import {
  toDateString,
  toDateTimeString,
  getCurrentDateStringInTimezone,
  getFacilityNowDate,
} from '@tamanu/utils/dateTime';
import { DefaultIconButton } from '../Button';
import { TextInput } from './TextField';
import { useDateTimeIfAvailable } from '../../contexts';

/*
 * DateInput wraps MUI DatePicker/DateTimePicker/TimePicker with timezone support.
 *
 * Timezone flow:
 *   - `timezone` prop (IANA string) controls what "today" means for the Today button,
 *     the calendar's reference date, and the today highlight circle. Falls back to
 *     facilityTimeZone → primaryTimeZone from the DateTimeContext if not supplied.
 *   - `useTimezone` (datetime-local only) converts stored values between primary and
 *     facility timezones, same as the previous native-input implementation.
 *
 * Value format is unchanged: string in, string out via onChange({ target: { value, name } }).
 */

function getTodayInTimezone(tz) {
  return parse(getCurrentDateStringInTimezone(tz), 'yyyy-MM-dd', new Date());
}

const PARSE_FORMATS = [
  "yyyy-MM-dd'T'HH:mm:ss",
  "yyyy-MM-dd'T'HH:mm",
  'yyyy-MM-dd HH:mm:ss',
  'yyyy-MM-dd HH:mm',
  'dd/MM/yyyy hh:mm a',
  'dd/MM/yyyy HH:mm',
  'dd/MM/yyyy',
  'yyyy-MM-dd',
  'HH:mm',
];

function parseValue(value, primaryFormat) {
  if (!value) return null;
  const formats = primaryFormat ? [primaryFormat, ...PARSE_FORMATS] : PARSE_FORMATS;
  for (const fmt of formats) {
    const date = parse(value, fmt, new Date());
    if (isValid(date)) return date;
  }
  return null;
}

const StyledPopper = styled(({ popperOptions, ...props }) => (
  <Popper
    {...props}
    placement="top-start"
    popperOptions={{
      ...popperOptions,
      modifiers: [
        ...(popperOptions?.modifiers || []),
        {
          name: 'flip',
          enabled: true,
          options: { fallbackPlacements: ['top-start', 'bottom-start'], rootBoundary: 'viewport' },
        },
        {
          name: 'preventOverflow',
          enabled: true,
          options: { rootBoundary: 'viewport', altAxis: true, padding: 8 },
        },
      ],
    }}
  />
))`
  z-index: 1300;

  .MuiDateCalendar-root {
    max-height: 300px;
  }

  .MuiPickersCalendarHeader-root {
    margin-top: 8px;
    min-height: unset;
  }

  .MuiDayCalendar-slideTransition {
    min-height: 210px;
  }

  .MuiMultiSectionDigitalClockSection-root {
    scrollbar-width: thin;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 2px;
    }
  }
`;

const ActionBarContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 4px 8px;
  gap: 4px;

  .MuiButton-root {
    font-size: 0.75rem;
    padding: 2px 8px;
    min-width: unset;
    color: #6fa2d0;
    text-transform: none;
  }
`;

const TimezoneActionBar = ({ onClear, onSetTodayAndClose, todayLabel = 'Today', actions = [], className }) => {
  if (!actions?.length) return null;
  return (
    <ActionBarContainer className={className}>
      {actions.includes('clear') && (
        <Button onClick={onClear} size="small">
          Clear
        </Button>
      )}
      {actions.includes('today') && (
        <Button onClick={onSetTodayAndClose} size="small">
          {todayLabel}
        </Button>
      )}
    </ActionBarContainer>
  );
};

const TimezoneDay = ({ todayInTimezone, day, ...other }) => {
  const isToday = !!(day && todayInTimezone && isSameDay(day, todayInTimezone));
  return <PickersDay {...other} day={day} today={isToday} />;
};

const DISPLAY_FORMATS = {
  date: 'dd/MM/yyyy',
  'datetime-local': 'dd/MM/yyyy hh:mm a',
  time: 'HH:mm',
};

export const DateInput = ({
  type = 'date',
  value,
  format = 'yyyy-MM-dd',
  onChange,
  name,
  max = '9999-12-31',
  min,
  saveDateAsString = false,
  arrows = false,
  inputProps = {},
  keepIncorrectValue, // eslint-disable-line no-unused-vars
  useTimezone = false,
  timezone,
  disabled,
  error,
  helperText,
  ['data-testid']: dataTestId,
  ...props
}) => {
  delete props.placeholder;

  const dateTime = useDateTimeIfAvailable();
  const shouldUseTimezone = useTimezone && type === 'datetime-local' && dateTime != null;
  const { toFacilityDateTime, toStoredDateTime } = dateTime ?? {};

  const effectiveTimezone = timezone ?? dateTime?.facilityTimeZone ?? dateTime?.primaryTimeZone;

  const todayDate = useMemo(
    () => (effectiveTimezone ? getTodayInTimezone(effectiveTimezone) : startOfToday()),
    [effectiveTimezone],
  );

  const dateValue = useMemo(() => {
    if (!value) return null;
    if (shouldUseTimezone && toFacilityDateTime) {
      const facilityValue = toFacilityDateTime(value);
      return facilityValue ? parseValue(facilityValue, "yyyy-MM-dd'T'HH:mm") : null;
    }
    return parseValue(value, format);
  }, [value, format, shouldUseTimezone, toFacilityDateTime]);

  const handleChange = useCallback(
    date => {
      if (!date || !isValid(date)) {
        onChange({ target: { value: '', name } });
        return;
      }

      let outputValue;
      if (shouldUseTimezone && toStoredDateTime) {
        outputValue = toStoredDateTime(
          `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
        );
      } else if (saveDateAsString) {
        outputValue = type === 'date' ? toDateString(date) : toDateTimeString(date);
      } else {
        outputValue = date.toISOString();
      }

      if (!outputValue || outputValue === 'Invalid date') {
        onChange({ target: { value: '', name } });
        return;
      }

      onChange({ target: { value: outputValue, name } });
    },
    [onChange, name, saveDateAsString, type, shouldUseTimezone, toStoredDateTime],
  );

  const [open, setOpen] = useState(false);

  const handleSetToday = useCallback(() => {
    if (type === 'time' || type === 'datetime-local') {
      const now = effectiveTimezone
        ? getFacilityNowDate(effectiveTimezone)
        : new Date();
      handleChange(now);
    } else {
      handleChange(todayDate);
    }
    setOpen(false);
  }, [handleChange, todayDate, type, effectiveTimezone]);

  const handleClear = useCallback(() => {
    onChange({ target: { value: '', name } });
    setOpen(false);
  }, [onChange, name]);

  const displayFormat = DISPLAY_FORMATS[type] || format;

  const handleTextBlur = useCallback(
    e => {
      const text = e.target.value?.trim();
      if (!text) return;
      const parsed = parseValue(text, displayFormat);
      if (parsed) handleChange(parsed);
    },
    [displayFormat, handleChange],
  );

  const maxDate = useMemo(() => {
    if (!max) return undefined;
    if (shouldUseTimezone && toFacilityDateTime) {
      const converted = toFacilityDateTime(max);
      if (converted) return parseValue(converted, "yyyy-MM-dd'T'HH:mm");
    }
    return parseValue(max, format);
  }, [max, format, shouldUseTimezone, toFacilityDateTime]);

  const minDate = useMemo(() => {
    if (!min) return undefined;
    if (shouldUseTimezone && toFacilityDateTime) {
      const converted = toFacilityDateTime(min);
      if (converted) return parseValue(converted, "yyyy-MM-dd'T'HH:mm");
    }
    return parseValue(min, format);
  }, [min, format, shouldUseTimezone, toFacilityDateTime]);

  const commonProps = {
    value: dateValue,
    onChange: handleChange,
    open,
    onOpen: () => setOpen(true),
    onClose: () => setOpen(false),
    referenceDate: todayDate,
    format: displayFormat,
    disabled,
    localeText: {
      fieldDayPlaceholder: () => 'dd',
      fieldMonthPlaceholder: () => 'mm',
      fieldYearPlaceholder: () => 'yyyy',
      fieldHoursPlaceholder: () => '--',
      fieldMinutesPlaceholder: () => '--',
      fieldMeridiemPlaceholder: () => '--',
    },
    slots: {
      actionBar: TimezoneActionBar,
      textField: TextInput,
      popper: StyledPopper,
      day: TimezoneDay,
    },
    slotProps: {
      actionBar: {
        actions: ['today', 'clear'],
        onSetTodayAndClose: handleSetToday,
        onClear: handleClear,
        todayLabel: type === 'date' ? 'Today' : 'Now',
      },
      textField: {
        name,
        'data-testid': dataTestId,
        error,
        helperText,
        inputProps,
        onBlur: handleTextBlur,
        ...props,
      },
      day: {
        todayInTimezone: todayDate,
      },
      openPickerButton: {
        sx: { padding: '2px', marginRight: '-4px', ...(disabled && { display: 'none' }) },
      },
      openPickerIcon: {
        sx: { fontSize: '1rem', color: '#326699' },
      },
    },
  };

  let picker;
  switch (type) {
    case 'time':
      picker = <TimePicker {...commonProps} timeSteps={{ minutes: 1 }} />;
      break;
    case 'datetime-local':
      picker = <DateTimePicker {...commonProps} maxDateTime={maxDate} minDateTime={minDate} timeSteps={{ minutes: 1 }} />;
      break;
    default:
      picker = <DatePicker {...commonProps} maxDate={maxDate} minDate={minDate} />;
      break;
  }

  if (arrows) {
    return (
      <Box display="flex" alignContent="center" data-testid="box-13xp">
        <DefaultIconButton
          onClick={() => handleChange(addDays(dateValue || todayDate, -1))}
          data-testid="defaulticonbutton-1fiy"
        >
          <KeyboardArrowLeftIcon data-testid="keyboardarrowlefticon-fn4i" />
        </DefaultIconButton>
        {picker}
        <DefaultIconButton
          onClick={() => handleChange(addDays(dateValue || todayDate, 1))}
          data-testid="defaulticonbutton-rmeh"
        >
          <KeyboardArrowRightIcon data-testid="keyboardarrowrighticon-9tyl" />
        </DefaultIconButton>
      </Box>
    );
  }

  return picker;
};

export const TimeInput = props => <DateInput type="time" format="HH:mm" {...props} />;

export const DateTimeInput = ({ useTimezone = true, ...props }) => (
  <DateInput
    type="datetime-local"
    format="yyyy-MM-dd'T'HH:mm"
    max="9999-12-31T00:00"
    useTimezone={useTimezone}
    {...props}
  />
);

export const DateField = ({ field, ...props }) => (
  <DateInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);

export const TimeField = ({ field, ...props }) => (
  <TimeInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);

export const DateTimeField = ({ field, ...props }) => (
  <DateTimeInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);
