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
import {
  addDays,
  format as dateFnsFormat,
  isValid,
  isSameDay,
  parse,
  parseISO,
  startOfToday,
} from 'date-fns';

import {
  toDateString,
  toDateTimeString,
  getCurrentDateStringInTimezone,
  getFacilityNowDate,
} from '@tamanu/utils/dateTime';
import { DefaultIconButton } from '../Button';
import { TextInput } from './TextField';
import { useDateTimeIfAvailable } from '../../contexts/DateTimeContext';
import { useTranslation } from '../../contexts/TranslationContext';

/*
 * DateInput wraps MUI DatePicker/DateTimePicker/TimePicker with timezone support.
 *
 * Timezone flow:
 *   - `timezone` prop (IANA string) controls what "today" means for the Today/Now button,
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
  if (typeof value === 'string' && /[TZ+\-\d]/.test(value.charAt(10))) {
    const iso = parseISO(value);
    if (isValid(iso)) return iso;
  }
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

  .MuiPickersLayout-contentWrapper {
    max-height: 300px;
  }

  .MuiDateCalendar-root {
    max-height: 300px;
  }

  .MuiPickersCalendarHeader-root {
    margin-top: 8px;
    min-height: unset;
  }

  .MuiDayCalendar-slideTransition {
    min-height: 220px;
  }

  .MuiMultiSectionDigitalClockSection-root {
    max-height: 310px;
    scrollbar-width: thin;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 2px;
    }
  }

  .MuiMultiSectionDigitalClockSection-root:last-child {
    max-height: unset;
    overflow: visible;
  }

  .MuiMultiSectionDigitalClockSection-item {
    font-size: 0.85rem;
    padding: 4px 8px;
    min-height: unset;
  }

  .MuiYearCalendar-root {
    max-height: 240px;
    width: 270px;
  }

  .MuiPickersYear-yearButton {
    font-size: 0.8rem;
    height: 28px;
    margin: 2px 0;
  }

  .MuiPickersYear-yearButton.Mui-selected,
  .MuiPickersDay-root.Mui-selected,
  .MuiMultiSectionDigitalClockSection-item.Mui-selected {
    background-color: #326699 !important;
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

const TimezoneActionBar = ({
  onClear,
  onSetToday,
  todayLabel,
  clearLabel,
  actions = [],
  className,
}) => {
  if (!actions?.length) return null;
  return (
    <ActionBarContainer className={className}>
      {actions.includes('clear') && (
        <Button onClick={onClear} size="small">
          {clearLabel}
        </Button>
      )}
      {actions.includes('today') && (
        <Button onClick={onSetToday} size="small">
          {todayLabel}
        </Button>
      )}
    </ActionBarContainer>
  );
};

const TimezoneDay = React.memo(({ todayInTimezone, day, ...other }) => {
  const isToday = !!(day && todayInTimezone && isSameDay(day, todayInTimezone));
  return <PickersDay {...other} day={day} today={isToday} />;
});

const DISPLAY_FORMATS = {
  date: 'dd/MM/yyyy',
  'datetime-local': 'dd/MM/yyyy hh:mm a',
  time: 'hh:mm a',
};

export const DateInput = ({
  type = 'date',
  value,
  format = 'yyyy-MM-dd',
  onChange,
  name,
  max = '2100-12-31',
  min,
  saveDateAsString = false,
  arrows = false,
  inputProps = {},
  useTimezone = false,
  timezone,
  disabled,
  error,
  helperText,
  ['data-testid']: dataTestId,
  ...props
}) => {
  const dateTime = useDateTimeIfAvailable();
  const { getTranslation } = useTranslation();
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
        outputValue = toStoredDateTime(dateFnsFormat(date, "yyyy-MM-dd'T'HH:mm"));
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
  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  const handleSetToday = useCallback(() => {
    const now = effectiveTimezone
      ? getFacilityNowDate(
          dateTime?.primaryTimeZone ?? effectiveTimezone,
          dateTime?.facilityTimeZone,
        )
      : new Date();
    handleChange(now);
  }, [handleChange, effectiveTimezone, dateTime?.primaryTimeZone, dateTime?.facilityTimeZone]);

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

  const parseDateBound = useCallback(
    bound => {
      if (!bound) return undefined;
      if (shouldUseTimezone && toFacilityDateTime) {
        const converted = toFacilityDateTime(bound);
        if (converted) return parseValue(converted, "yyyy-MM-dd'T'HH:mm");
      }
      return parseValue(bound, format);
    },
    [format, shouldUseTimezone, toFacilityDateTime],
  );

  const maxDate = useMemo(() => parseDateBound(max), [parseDateBound, max]);
  const minDate = useMemo(() => parseDateBound(min), [parseDateBound, min]);

  const commonProps = {
    value: dateValue,
    onChange: handleChange,
    open,
    onOpen: handleOpen,
    onClose: handleClose,
    referenceDate: todayDate,
    format: displayFormat,
    disabled,
    localeText: {
      fieldDayPlaceholder: () => getTranslation('date.placeholder.day', 'dd'),
      fieldMonthPlaceholder: () => getTranslation('date.placeholder.month', 'mm'),
      fieldYearPlaceholder: () => getTranslation('date.placeholder.year', 'yyyy'),
      fieldHoursPlaceholder: () => getTranslation('date.placeholder.hours', '--'),
      fieldMinutesPlaceholder: () => getTranslation('date.placeholder.minutes', '--'),
      fieldMeridiemPlaceholder: () => getTranslation('date.placeholder.meridiem', '--'),
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
        onSetToday: handleSetToday,
        onClear: handleClear,
        todayLabel:
          type === 'time'
            ? getTranslation('date.now', 'Now')
            : getTranslation('date.today', 'Today'),
        clearLabel: getTranslation('date.clear', 'Clear'),
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
      picker = (
        <DateTimePicker
          {...commonProps}
          maxDateTime={maxDate}
          minDateTime={minDate}
          timeSteps={{ minutes: 1 }}
        />
      );
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
    // Stop mui rendering 8000 year buttons
    max="2100-12-31T00:00"
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
