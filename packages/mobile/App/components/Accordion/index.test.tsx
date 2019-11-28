import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import AccordionList from './index';
import { data } from './fixtures';
import { formatDate } from '../../helpers/date';
import { DateFormats } from '../../helpers/constants';

describe('AccordionList', () => {
  const { getAllByText, getByText, findByText } = render(
    <AccordionList dataArray={data} />,
  );
  it('should Render Accordion header', () => {
    for (const historyEntry of data) {
      const historyDate = formatDate(
        historyEntry.date,
        DateFormats.DAY_MONTH_YEAR_SHORT,
      );
      expect(findByText(historyDate)).not.toBeNull();
      expect(getByText(historyEntry.type, { exact: false })).not.toBeNull();
      expect(getByText(historyEntry.location)).not.toBeNull();
    }
  });

  it('should render content', () => {
    expect(getByText(data[1].diagnosis)).not.toBeNull();
    expect(getByText(data[1].treament)).not.toBeNull();
    for (const medication of data[1].medications) {
      expect(getByText(medication.name)).not.toBeNull();
    }
    expect(getAllByText(data[0].practitioner.name)[0]).not.toBeNull();
  });
});
