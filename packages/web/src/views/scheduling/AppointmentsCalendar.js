import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { format, add, startOfDay, endOfDay } from 'date-fns';
import { ButtonGroup, IconButton, Typography } from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/KeyboardArrowLeft';
import ArrowForwardIcon from '@material-ui/icons/KeyboardArrowRight';

import { PageContainer, TopBar } from '../../components';
import { TwoColumnDisplay } from '../../components/TwoColumnDisplay';
import { DailySchedule } from '../../components/Appointments/DailySchedule';
import { NewAppointmentButton } from '../../components/Appointments/NewAppointmentButton';
import { Button } from '../../components/Button';
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
  font-size: 1.2em;
  margin: 0 12px;
  min-width: 250px;
  display: flex;
  justify-content: center;
  color: ${Colors.darkText};
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

const NavigationButton = styled(IconButton)`
  color: ${Colors.darkText};
  padding: 4px;
`;

const TodayButton = styled(Button)`
  margin-right: 12px;
  & span {
    text-decoration: underline;
  }
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
              <TodayButton
                variant="text"
                onClick={() => {
                  setDate(new Date());
                }}
              >
                Today
              </TodayButton>

              <NavigationButton
                onClick={() => {
                  setDate(add(date, { days: -1 }));
                }}
              >
                <ArrowBackIcon />
              </NavigationButton>
              <DateDisplay>{format(date, 'EEEE dd MMMM yyyy')}</DateDisplay>
              <NavigationButton
                onClick={() => {
                  setDate(add(date, { days: 1 }));
                }}
              >
                <ArrowForwardIcon />
              </NavigationButton>
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
