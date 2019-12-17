import React, { useState } from 'react';
import { DateField } from './DateField';

interface BaseDateTextFieldStory {
  label: string;
  error?: string;
}

export function BaseDateTextFieldStory({
  label,
  error,
}: BaseDateTextFieldStory) {
  const [date, setDate] = useState<Date | null>(null);
  const onChangeDate = (newDate: Date) => {
    setDate(newDate);
  };
  return (
    <DateField
      label={label}
      value={date}
      error={error}
      onChange={onChangeDate}
    />
  );
}
