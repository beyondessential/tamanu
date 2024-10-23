import React from 'react';
import { Button, PageContainer, TopBar, TranslatedText } from '../../components';
import styled from 'styled-components';

const Placeholder = styled.div`
  background-color: oklch(0% 0 0 / 3%);
  max-block-size: 100%;
  border: 1px solid oklch(0% 0 0 / 15%);
  border-radius: 0.2rem;
  color: oklch(0% 0 0 / 55%);
  display: grid;
  font-size: 1rem;
  padding: 0.5rem;
  place-items: center;
  text-align: center;
`;

const Wrapper = styled(PageContainer)`
  display: grid;
  grid-template-rows: auto 1fr;
  max-block-size: 100%;
`;

const LocationBookingsTopBar = styled(TopBar).attrs({
  title: <TranslatedText stringId="scheduling.appointments.title" fallback="Appointments" />,
})``;

const Filters = styled('search')`
  display: flex;
  gap: 1rem;
`;

const NewBookingButton = styled(Button)`
  margin-left: 1rem;
`;

export const OutpatientAppointmentsCalendar = () => {
  return (
    <Wrapper>
      <PageContainer>
        <LocationBookingsTopBar>
          <Filters>
            <Placeholder>Search</Placeholder>
            <Placeholder>Area</Placeholder>
            <Placeholder>Clinician</Placeholder>
            <Placeholder>Type</Placeholder>
          </Filters>
          <NewBookingButton onClick={null}>+ New booking</NewBookingButton>
        </LocationBookingsTopBar>
      </PageContainer>
    </Wrapper>
  );
};
