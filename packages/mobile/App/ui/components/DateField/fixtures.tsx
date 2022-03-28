import React, { useState } from 'react';
import { DateField } from './DateField';

interface BaseDateTextFieldStory {
  label: string;
  error: string;
  mode: 'date' | 'time';
}

export function BaseDateTextFieldStory({
  label,
  error,
  mode,
}: BaseDateTextFieldStory): JSX.Element {
  const [date, setDate] = useState<Date | null>(null);
  const onChangeDate = (newDate: Date): void => {
    setDate(newDate);
  };
  return (
    <DateField
      mode={mode}
      label={label}
      value={date}
      error={error}
      onChange={onChangeDate}
    />
  );
}
