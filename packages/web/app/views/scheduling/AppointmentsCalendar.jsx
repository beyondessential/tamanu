import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { add, endOfDay, format, startOfDay } from 'date-fns';
import { ButtonGroup, IconButton, Typography } from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/KeyboardArrowLeft';
import ArrowForwardIcon from '@material-ui/icons/KeyboardArrowRight';

import { toDateTimeString } from '@tamanu/shared/utils/dateTime';
import { PageContainer, TOP_BAR_HEIGHT, TopBar as TopBarBase } from '../../components';
import { TwoColumnDisplay } from '../../components/TwoColumnDisplay';
import { DailySchedule } from '../../components/Appointments/DailySchedule';
import { NewAppointmentButton } from '../../components/Appointments/NewAppointmentButton';
import { Button } from '../../components/Button';
import { AutocompleteInput, TranslatedMultiSelectField } from '../../components/Field';
import { Colors } from '../../constants';
import { useApi, useSuggester } from '../../api';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { useAuth } from '../../contexts/Auth';
import { ErrorMessage } from '../../components/ErrorMessage';
import { APPOINTMENT_TYPE_LABELS } from '@tamanu/constants';

const LeftContainer = styled.div`
  min-height: 100%;
  border-right: 1px solid ${Colors.outline};
`;

const RightContainer = styled.div`
  position: relative;
`;

const TopBar = styled(TopBarBase)`
  position: sticky;
  top: 0;
  height: ${TOP_BAR_HEIGHT}px;
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
  overflow: auto;
  height: calc(100vh - ${TOP_BAR_HEIGHT}px - 1px);
  width: 100%;
  position: absolute;
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
  const locationGroupSuggester = useSuggester('facilityLocationGroup');
  const practitionerSuggester = useSuggester('practitioner');
  const { ability } = useAuth();

  const [date, setDate] = useState(new Date());
  const [filterValue, setFilterValue] = useState('');
  const [appointmentType, setAppointmentType] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [refreshCount, setRefreshCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState('locationGroup');

  const hasPermission = ability.can('list', 'Appointment');

  const updateCalendar = () => {
    setRefreshCount(refreshCount + 1);
  };
  const updateFilterValue = e => setFilterValue(e.target.value || '');

  const filters = {
    locationGroup: {
      label: <TranslatedText stringId="general.area.label" fallback="Area" />,
      component: (
        <AutocompleteInput
          value={filterValue}
          onChange={updateFilterValue}
          suggester={locationGroupSuggester}
        />
      ),
    },
    clinician: {
      label: (
        <TranslatedText
          stringId="general.localisedField.clinician.label.plural"
          fallback="Clinicians"
        />
      ),
      component: (
        <AutocompleteInput
          value={filterValue}
          onChange={updateFilterValue}
          suggester={practitionerSuggester}
        />
      ),
    },
  };

  useEffect(() => {
    (async () => {
      const { data } = await api.get('appointments', {
        after: toDateTimeString(startOfDay(date)),
        before: toDateTimeString(endOfDay(date)),
        all: true,
      });
      setAppointments(data);
    })();
  }, [api, date, refreshCount]);

  return (
    <PageContainer>
      <TwoColumnDisplay>
        <LeftContainer>
          <TopBarBase
            title={
              <TranslatedText stringId="scheduling.appointmentCalendar.title" fallback="Calendar" />
            }
          />
          <Section>
            <SectionTitle variant="subtitle2">
              <TranslatedText
                stringId="scheduling.appointmentCalendar.subTitle"
                fallback="View calendar by"
              />
              :
            </SectionTitle>
            <FilterSwitch>
              {Object.entries(filters).map(([key, { label }]) => (
                <Button
                  key={key}
                  color={key === activeFilter ? 'primary' : null}
                  variant={key === activeFilter ? 'contained' : null}
                  onClick={() => {
                    setActiveFilter(key);
                    setFilterValue('');
                  }}
                >
                  {label}
                </Button>
              ))}
            </FilterSwitch>
          </Section>
          <Section>
            <SectionTitle variant="subtitle2">{filters[activeFilter].label}</SectionTitle>
            {filters[activeFilter].component}
          </Section>
          <Section>
            <SectionTitle variant="subtitle2">
              <TranslatedText stringId="appointment.type.label" fallback="Appointment type" />
            </SectionTitle>
            <TranslatedMultiSelectField
              onChange={e => {
                if (!e.target.value) {
                  setAppointmentType([]);
                  return;
                }
                setAppointmentType(JSON.parse(e.target.value));
              }}
              value={appointmentType}
              name="appointmentType"
              enumValues={APPOINTMENT_TYPE_LABELS}
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
                <TranslatedText
                  stringId="scheduling.appointmentCalendar.action.today"
                  fallback="Today"
                />
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
            {!hasPermission ? (
              <ErrorMessage
                title={
                  <TranslatedText stringId="general.error.noPermission" fallback="No permission" />
                }
                errorMessage={
                  <TranslatedText
                    stringId="schedule.appointmentCalendar.error.noPermission"
                    fallback="You do not have permission to view the appointments calendar. If you require access, please contact your administrator."
                  />
                }
              />
            ) : (
              <DailySchedule
                appointments={appointments}
                activeFilter={activeFilter}
                filterValue={filterValue}
                appointmentType={appointmentType}
                onAppointmentUpdated={updateCalendar}
              />
            )}
          </CalendarContainer>
        </RightContainer>
      </TwoColumnDisplay>
    </PageContainer>
  );
};
