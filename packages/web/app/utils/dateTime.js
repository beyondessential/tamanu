// Import all the shared date time utils here for backwards compatibility
export * from '@tamanu/shared/utils/dateTime';
export * from '@tamanu/shared/utils/date';

export const getLocaleDatePlaceholder = () => {
  const format = new Intl.DateTimeFormat();
  const parts = format.formatToParts(new Date());

  let placeholder = '';
  parts.forEach(part => {
    if (part.type === 'day') placeholder += 'dd';
    else if (part.type === 'month') placeholder += 'mm';
    else if (part.type === 'year') placeholder += 'yyyy';
    else placeholder += part.value;
  });

  return placeholder;
};
