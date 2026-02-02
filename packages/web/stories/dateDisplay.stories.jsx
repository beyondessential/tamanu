import React from 'react';
import { storiesOf } from '@storybook/react';
import Box from '@material-ui/core/Box';
import {
  DateDisplay,
  TimeDisplay,
  MultilineDatetimeDisplay,
  TimeRangeDisplay,
  DateTimeRangeDisplay,
} from '../app/components/DateDisplay';

const testDate = new Date();
const endDate = new Date(testDate.getTime() + 60 * 60 * 1000);
const multiDayEndDate = new Date(testDate.getTime() + 26 * 60 * 60 * 1000);

const Section = ({ title, children }) => (
  <Box mb={4}>
    <Box mb={1} fontWeight="bold" color="#666">
      {title}
    </Box>
    {children}
  </Box>
);

const Row = ({ label, children }) => (
  <Box mb={1} display="flex" alignItems="center">
    <Box width={280} color="#888" fontSize={14}>
      {label}
    </Box>
    {children}
  </Box>
);

storiesOf('DateDisplay', module)
  .addParameters({
    note: 'Displays dates and times in locale-appropriate formats. Hover for more details.',
  })
  .add('DateDisplay', () => (
    <Box p={5}>
      <Section title="Date Formats">
        <Row label='format="short" (default)'>
          <DateDisplay date={testDate} />
        </Row>
        <Row label='format="shortest"'>
          <DateDisplay date={testDate} format="shortest" />
        </Row>
        <Row label='format="long"'>
          <DateDisplay date={testDate} format="long" />
        </Row>
        <Row label='format="explicit"'>
          <DateDisplay date={testDate} format="explicit" />
        </Row>
        <Row label='format="explicitShort"'>
          <DateDisplay date={testDate} format="explicitShort" />
        </Row>
        <Row label='format="dayMonth"'>
          <DateDisplay date={testDate} format="dayMonth" />
        </Row>
        <Row label='weekdayFormat="short"'>
          <DateDisplay date={testDate} weekdayFormat="short" />
        </Row>
        <Row label='weekdayFormat="short" format="long"'>
          <DateDisplay date={testDate} weekdayFormat="short" format="long" />
        </Row>
      </Section>

      <Section title="With Time">
        <Row label='timeFormat="default"'>
          <DateDisplay date={testDate} timeFormat="default" />
        </Row>
        <Row label='timeFormat="compact"'>
          <DateDisplay date={testDate} timeFormat="compact" />
        </Row>
        <Row label='timeFormat="withSeconds"'>
          <DateDisplay date={testDate} timeFormat="withSeconds" />
        </Row>
        <Row label='format="shortest" timeFormat="compact"'>
          <DateDisplay date={testDate} format="shortest" timeFormat="compact" />
        </Row>
        <Row label='weekdayFormat="short" timeFormat="compact"'>
          <DateDisplay date={testDate} weekdayFormat="short" timeFormat="compact" />
        </Row>
      </Section>

      <Section title="Options">
        <Row label="noTooltip">
          <DateDisplay date={testDate} timeFormat="default" noTooltip />
        </Row>
      </Section>
    </Box>
  ))
  .add('TimeDisplay', () => (
    <Box p={5}>
      <Section title="Time Formats">
        <Row label='format="default" (default)'>
          <TimeDisplay date={testDate} />
        </Row>
        <Row label='format="compact"'>
          <TimeDisplay date={testDate} format="compact" />
        </Row>
        <Row label='format="withSeconds"'>
          <TimeDisplay date={testDate} format="withSeconds" />
        </Row>
        <Row label='format="slot"'>
          <TimeDisplay date={testDate} format="slot" />
        </Row>
      </Section>
    </Box>
  ))
  .add('Compound Components', () => (
    <Box p={5}>
      <Section title="MultilineDatetimeDisplay">
        <Row label="default">
          <MultilineDatetimeDisplay date={testDate} />
        </Row>
        <Row label='format="explicit"'>
          <MultilineDatetimeDisplay date={testDate} format="explicit" />
        </Row>
        <Row label="isTimeSoft={false}">
          <MultilineDatetimeDisplay date={testDate} isTimeSoft={false} />
        </Row>
      </Section>

      <Section title="TimeRangeDisplay">
        <Row label="Time range (same day)">
          <TimeRangeDisplay range={{ start: testDate, end: endDate }} />
        </Row>
      </Section>

      <Section title="DateTimeRangeDisplay">
        <Row label="Same day range">
          <DateTimeRangeDisplay start={testDate} end={endDate} weekdayFormat="short" />
        </Row>
        <Row label="Multi-day range">
          <DateTimeRangeDisplay start={testDate} end={multiDayEndDate} weekdayFormat="short" />
        </Row>
        <Row label="Single date (no end)">
          <DateTimeRangeDisplay start={testDate} weekdayFormat="short" />
        </Row>
        <Row label='Same day, format="shortest"'>
          <DateTimeRangeDisplay start={testDate} end={endDate} weekdayFormat="short" dateFormat="shortest" />
        </Row>
        <Row label="No weekday (default)">
          <DateTimeRangeDisplay start={testDate} end={endDate} />
        </Row>
      </Section>
    </Box>
  ));
