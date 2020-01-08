import React, { useState } from 'react';
import { DateField } from './DateField';

interface BaseDateTextFieldStory {
  label: string;
  error?: string;
  mode?: 'date' | 'time';
}

export function BaseDateTextFieldStory({
  label,
  error,
  mode,
}: BaseDateTextFieldStory) {
  const [date, setDate] = useState<Date | null>(null);
  const onChangeDate = (newDate: Date) => {
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
