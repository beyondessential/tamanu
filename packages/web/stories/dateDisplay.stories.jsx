import React from 'react';
import { storiesOf } from '@storybook/react';
import Box from '@material-ui/core/Box';
import { DateDisplay, TimeDisplay, MultilineDatetimeDisplay, TimeRangeDisplay } from '../app/components/DateDisplay';

const testDate = new Date();
const endDate = new Date(testDate.getTime() + 60 * 60 * 1000);

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
        <Row label="showWeekday">
          <DateDisplay date={testDate} showWeekday />
        </Row>
      </Section>

      <Section title="With Time">
        <Row label="showTime">
          <DateDisplay date={testDate} showTime />
        </Row>
        <Row label='showTime timeFormat="compact"'>
          <DateDisplay date={testDate} showTime timeFormat="compact" />
        </Row>
        <Row label='showTime timeFormat="withSeconds"'>
          <DateDisplay date={testDate} showTime timeFormat="withSeconds" />
        </Row>
        <Row label='format="shortest" showTime timeFormat="compact"'>
          <DateDisplay date={testDate} format="shortest" showTime timeFormat="compact" />
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
        <Row label="Time range">
          <TimeRangeDisplay range={{ start: testDate, end: endDate }} />
        </Row>
      </Section>
    </Box>
  ));
