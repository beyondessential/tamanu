import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { format, add, startOfDay, endOfDay } from 'date-fns';
import { ButtonGroup, Typography } from '@material-ui/core';

import { PageContainer, TopBar } from '../../components';
import { TwoColumnDisplay } from '../../components/TwoColumnDisplay';
import { DailySchedule } from '../../components/Appointments/DailySchedule';
import { NewAppointmentButton } from '../../components/Appointments/NewAppointmentButton';
import { BackButton, ForwardButton, Button } from '../../components/Button';
import { AutocompleteInput, MultiselectInput } from '../../components/Field';
import { Suggester } from '../../utils/suggester';
import { Colors, appointmentTypeOptions } from '../../constants';
import { useApi } from '../../api';

const LeftContainer = styled.div`
  min-height: 100vh;
  border-right: 1px solid ${Colors.outline};
`;

const RightContainer = styled.div`
  overflow: hidden;
`;

const DateHeader = styled.div`
  display: flex;
  align-items: center;
`;

const DateDisplay = styled.span`
  margin-left: 1rem;
  font-size: 1.2em;
  color: ${Colors.darkText};
`;

const DateNav = styled.div`
  width: 3.5rem;
`;

const CalendarContainer = styled.div`
  margin-left: calc(25px + 3.5rem);
  margin-right: 25px;
  overflow: auto;
`;

const Section = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${Colors.outline};
  display: flex;
  flex-direction: column;
`;

const SectionTitle = styled(Typography)`
  margin-bottom: 1rem;
`;

const FilterSwitch = styled(ButtonGroup)`
  margin-top: 0.5rem;
`;

export const AppointmentsCalendar = () => {
  const api = useApi();
  const filters = [
    {
      name: 'location',
      text: 'Locations',
      suggester: new Suggester(api, 'location', {
        baseQueryParameters: { filterByFacility: true },
      }),
    },
    {
      name: 'clinician',
      text: 'Clinicians',
      suggester: new Suggester(api, 'practitioner'),
    },
  ];
  const [date, setDate] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [filterValue, setFilterValue] = useState('');
  const [appointmentType, setAppointmentType] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [refreshCount, setRefreshCount] = useState(0);
  const updateCalendar = () => {
    setRefreshCount(refreshCount + 1);
  };
  useEffect(() => {
    (async () => {
      const { data } = await api.get('appointments', {
        after: startOfDay(date).toISOString(),
        before: endOfDay(date).toISOString(),
        all: true,
      });
      setAppointments(data);
    })();
  }, [api, date, refreshCount]);
  return (
    <PageContainer>
      <TwoColumnDisplay>
        <LeftContainer>
          <TopBar title="Calendar" />
          <Section>
            <SectionTitle variant="subtitle2">View calendar by:</SectionTitle>
            <FilterSwitch>
              {filters.map(filter => (
                <Button
                  key={filter.name}
                  color={filter.name === activeFilter.name ? 'primary' : null}
                  variant={filter.name === activeFilter.name ? 'contained' : null}
                  onClick={() => {
                    setActiveFilter(filter);
                    setFilterValue('');
                  }}
                >
                  {filter.text}
                </Button>
              ))}
            </FilterSwitch>
          </Section>
          <Section>
            <SectionTitle variant="subtitle2">{activeFilter.text}</SectionTitle>
            <AutocompleteInput
              value={filterValue}
              onChange={e => {
                setFilterValue(e.target.value);
              }}
              suggester={activeFilter.suggester}
            />
          </Section>
          <Section>
            <SectionTitle variant="subtitle2">Appointment type</SectionTitle>
            <MultiselectInput
              onChange={e => {
                if (!e.target.value) {
                  setAppointmentType([]);
                  return;
                }
                setAppointmentType(e.target.value.split(', '));
              }}
              options={appointmentTypeOptions}
            />
          </Section>
        </LeftContainer>
        <RightContainer>
          <TopBar>
            <DateHeader>
              <DateNav>
                <BackButton
                  text={false}
                  onClick={() => {
                    setDate(add(date, { days: -1 }));
                  }}
                />
                <ForwardButton
                  onClick={() => {
                    setDate(add(date, { days: 1 }));
                  }}
                />
              </DateNav>
              <Button
                variant="contained"
                onClick={() => {
                  setDate(new Date());
                }}
              >
                Today
              </Button>
              <DateDisplay>{format(date, 'EEEE dd MMMM yyyy')}</DateDisplay>
            </DateHeader>
            <NewAppointmentButton onSuccess={updateCalendar} />
          </TopBar>
          <CalendarContainer>
            <DailySchedule
              appointments={appointments}
              activeFilter={activeFilter}
              filterValue={filterValue}
              appointmentType={appointmentType}
              onAppointmentUpdated={updateCalendar}
            />
          </CalendarContainer>
        </RightContainer>
      </TwoColumnDisplay>
    </PageContainer>
  );
};
