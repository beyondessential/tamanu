import React from 'react';
import { render } from '@testing-library/react-native';
import { formatDate } from '/helpers/date';
import { DateFormats } from '/helpers/constants';
import { AccordionList } from './index';
import { data } from './fixtures';

describe('AccordionList', () => {
  const { getAllByText, getByText, findByText } = render(
    <AccordionList dataArray={data} />,
  );
  it('should Render Accordion header', () => {
    data.forEach(historyEntry => {
      const historyDate = formatDate(
        historyEntry.date,
        DateFormats.DAY_MONTH_YEAR_SHORT,
      );
      expect(findByText(historyDate)).not.toBeNull();
      expect(getByText(historyEntry.type, { exact: false })).not.toBeNull();
      expect(getByText(historyEntry.location)).not.toBeNull();
    });
  });

  it('should render content', () => {
    expect(getByText(data[1].diagnosis)).not.toBeNull();
    expect(getByText(data[1].treament)).not.toBeNull();
    data[1].medications.forEach(medication => {
      expect(getByText(medication.name)).not.toBeNull();
    });
    expect(getAllByText(data[0].practitioner.name)[0]).not.toBeNull();
  });
});
