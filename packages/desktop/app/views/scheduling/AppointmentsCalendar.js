import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { format, add, startOfDay, endOfDay } from 'date-fns';
import { ButtonGroup, Typography } from '@material-ui/core';
import { groupBy } from 'lodash';

import { PageContainer, TopBar } from '../../components';
import { TwoColumnDisplay } from '../../components/TwoColumnDisplay';
import { DailySchedule } from '../../components/Appointments/DailySchedule';
import { NewAppointmentButton } from '../../components/Appointments/NewAppointmentButton';
import { BackButton, ForwardButton, Button } from '../../components/Button';
import { Field, Form, AutocompleteField, MultiselectField } from '../../components/Field';
import { Suggester } from '../../utils/suggester';
import { Colors, appointmentTypeOptions } from '../../constants';
import { useApi } from '../../api';

const Container = styled.div`
  min-height: 100vh;
  border-right: 1px solid ${Colors.outline};
`;

const DateHeader = styled.div`
  display: flex;
  align-items: center;
`;

const DateDisplay = styled.span`
  margin-left: 1rem;
  font-size: 1.2em;
`;

const DateNav = styled.div`
  width: 3.5rem;
`;

const CalendarContainer = styled.div`
  margin-left: calc(25px + 3.5rem);
  margin-right: 25px;
`;

const Section = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${Colors.outline};
  display: flex;
  flex-direction: column;
  form {
    margin-top: 1rem;
  }
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
      suggester: new Suggester(api, 'location'),
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
  useEffect(() => {
    (async () => {
      const { data } = await api.get('appointments', {
        after: startOfDay(date).toISOString(),
        before: endOfDay(date).toISOString(),
      });
      setAppointments(data);
    })();
  }, [date]);
  const appointmentGroups = groupBy(appointments, appt => appt[activeFilter.name].id);
  return (
    <PageContainer>
      <TwoColumnDisplay>
        <Container>
          <TopBar title="Calendar" />
          <Section>
            <Typography variant="subtitle2">View calendar by:</Typography>
            <FilterSwitch>
              {filters.map(filter => (
                <Button
                  color={filter.name === activeFilter.name ? 'primary' : null}
                  variant={filter.name === activeFilter.name ? 'contained' : null}
                  onClick={() => {
                    setActiveFilter(filter);
                  }}
                >
                  {filter.text}
                </Button>
              ))}
            </FilterSwitch>
          </Section>
          <Section>
            <Typography variant="subtitle2">{activeFilter.text}</Typography>
            <Form
              render={() => (
                <Field
                  name="filter"
                  component={AutocompleteField}
                  suggester={activeFilter.suggester}
                  value={filterValue}
                  onChange={e => {
                    setFilterValue(e.target.value);
                  }}
                />
              )}
            />
          </Section>
          <Section>
            <Typography variant="subtitle2">Appointment type</Typography>
            <Form
              render={() => (
                <Field
                  name="appointment-type"
                  component={MultiselectField}
                  options={appointmentTypeOptions}
                  onChange={e => {
                    if (!e.target.value) {
                      setAppointmentType([]);
                      return;
                    }
                    setAppointmentType(e.target.value.split(','));
                  }}
                />
              )}
            />
          </Section>
        </Container>
        <div>
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
            <NewAppointmentButton
              onSuccess={() => {
                // set date to trigger a refresh
                setDate(new Date());
              }}
            />
          </TopBar>
          <CalendarContainer>
            <DailySchedule
              appointmentGroups={appointmentGroups}
              activeFilter={activeFilter}
              filterValue={filterValue}
              appointmentType={appointmentType}
            />
          </CalendarContainer>
        </div>
      </TwoColumnDisplay>
    </PageContainer>
  );
};
