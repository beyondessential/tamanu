import Chance from 'chance';
import React from 'react';
import styled from 'styled-components';

import { Colors } from '../../constants';
import { useApi } from '../../api';
import { PageContainer, TOP_BAR_HEIGHT, TopBar, TranslatedText } from '../../components';
import { CalendarCell } from './CalendarCell';

// BEGIN PLACEHOLDERS

const chance = new Chance();

const locations = Array.from({ length: 8 }, () => ({
  id: chance.guid(),
  code: chance.syllable(),
  name: chance.sentence({ words: 3 }).slice(0, -1),
  locationGroupId: chance.guid(),
}));

const Placeholder = styled.div`
  background-color: oklch(0% 0 0 / 3%);
  block-size: 100%;
  border: 1px solid oklch(0% 0 0 / 15%);
  color: oklch(0% 0 0 / 55%);
  display: grid;
  font-size: 1rem;
  inline-size: 100%;
  padding: 0.5rem;
  place-items: center;
  text-align: center;
`;

// END PLACEHOLDERS

const Wrapper = styled(PageContainer)`
  display: grid;
  grid-template-rows: min-content auto;
`;

const Filters = styled('search')`
  display: flex;
  gap: 1rem;
`;

const GridCarousel = styled.div``;

const CalendarGrid = styled.div`
  --location-count: 10;
  --week-count: 6; // A month can span 4–6 distinct ISO weeks
  --day-count: calc(var(--week-count) * 7);

  --header-col-width: 8rem;
  --col-width: calc((100cqi - var(--header-col-width)) / 7.5);

  background-color: ${Colors.white};
  border: max(0.0625rem, 1px) solid ${Colors.outline};
  display: grid;
  grid-auto-flow: column;
  grid-template-columns: 8rem repeat(calc(var(--day-count), var(--col-width)));
  grid-template-rows: repeat(var(--location-count), minmax(2.25rem, max-content));
  margin: 1rem;
  scroll-snap-type: inline mandatory;
`;

const TableCarousel = styled.table`
  --location-count: 10;
  --week-count: 6; // A month can span 4–6 distinct ISO weeks

  --header-col-width: 8rem;
  --col-width: calc((100cqi - var(--header-col-width)) / 7.5);

  border-collapse: collapse;
  background-color: ${Colors.white};
  border: max(0.0625rem, 1px) solid ${Colors.outline};
  margin: 1rem;
`;

export const AppointmentsCalendar = () => {
  // const api = useApi();
  const appointments = [
    {
      id: '8c417eb4-d8f2-441f-91ed-2e5de7e89ee8',
      startTime: '2024-09-12 11:48:00',
      endTime: null,
      type: 'Standard',
      status: 'Confirmed',
      updatedAtSyncTick: '35538',
      createdAt: '2024-09-11T23:48:22.958Z',
      updatedAt: '2024-09-11T23:48:22.958Z',
      deletedAt: null,
      patientId: '41f97737-be54-4e43-ba04-78b39656c30b',
      clinicianId: '11111111-1111-1111-1111-111111111111',
      locationGroupId: 'locationgroup-Theatre1-tamanu',
      locationId: null,
      patient: {
        id: '41f97737-be54-4e43-ba04-78b39656c30b',
        displayId: 'RQLN820387',
        firstName: 'Adeline',
        middleName: 'Ora',
        lastName: 'Giannoni',
        culturalName: 'Hattie',
        dateOfBirth: '1998-12-20',
        dateOfDeath: null,
        sex: 'female',
        email: null,
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2024-06-24T00:11:13.082Z',
        updatedAt: '2024-06-24T00:11:13.082Z',
        deletedAt: null,
        villageId: 'village-Matacaucau',
        mergedIntoId: null,
        village: {
          id: 'village-Matacaucau',
          code: 'Matacaucau',
          type: 'village',
          name: 'Matacaucau',
          visibilityStatus: 'current',
          updatedAtSyncTick: '-999',
          createdAt: '2024-06-24T00:11:01.546Z',
          updatedAt: '2024-06-24T00:11:01.546Z',
          deletedAt: null,
        },
      },
      clinician: {
        id: '11111111-1111-1111-1111-111111111111',
        displayId: null,
        email: 'jasper@bes.au',
        displayName: 'Jasper Lai',
        role: 'admin',
        phoneNumber: null,
        visibilityStatus: 'current',
        updatedAtSyncTick: '35406',
        createdAt: '2024-08-10T00:11:17.557Z',
        updatedAt: '2024-09-11T23:03:33.526Z',
        deletedAt: null,
      },
      locationGroup: {
        id: 'locationgroup-Theatre1-tamanu',
        code: 'Theatre1',
        name: 'Operating Theatre',
        visibilityStatus: 'current',
        updatedAtSyncTick: '6528',
        createdAt: '2024-06-24T00:11:12.974Z',
        updatedAt: '2024-07-08T23:17:02.816Z',
        deletedAt: null,
        facilityId: 'facility-a',
      },
    },
    {
      id: '009f844a-20e1-47e0-aa82-30ab92017255',
      startTime: '2024-09-12 11:49:00',
      endTime: null,
      type: 'Specialist',
      status: 'Confirmed',
      updatedAtSyncTick: '35542',
      createdAt: '2024-09-11T23:49:49.375Z',
      updatedAt: '2024-09-11T23:49:49.375Z',
      deletedAt: null,
      patientId: 'f8e332bb-6366-44f2-8254-1f10e4bd3bf7',
      clinicianId: '11111111-1111-1111-1111-111111111111',
      locationGroupId: 'locationgroup-Theatre1-tamanu',
      locationId: null,
      patient: {
        id: 'f8e332bb-6366-44f2-8254-1f10e4bd3bf7',
        displayId: 'TJOR564025',
        firstName: 'Andre',
        middleName: 'Elijah',
        lastName: 'Tinti',
        culturalName: 'Samuel',
        dateOfBirth: '1941-09-04',
        dateOfDeath: null,
        sex: 'male',
        email: null,
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2024-06-24T00:11:13.082Z',
        updatedAt: '2024-06-24T00:11:13.082Z',
        deletedAt: null,
        villageId: 'village-Nasau',
        mergedIntoId: null,
        village: {
          id: 'village-Nasau',
          code: 'Nasau',
          type: 'village',
          name: 'Nasau',
          visibilityStatus: 'current',
          updatedAtSyncTick: '-999',
          createdAt: '2024-06-24T00:11:06.577Z',
          updatedAt: '2024-06-24T00:11:06.577Z',
          deletedAt: null,
        },
      },
      clinician: {
        id: '11111111-1111-1111-1111-111111111111',
        displayId: null,
        email: 'jasper@bes.au',
        displayName: 'Jasper Lai',
        role: 'admin',
        phoneNumber: null,
        visibilityStatus: 'current',
        updatedAtSyncTick: '35406',
        createdAt: '2024-08-10T00:11:17.557Z',
        updatedAt: '2024-09-11T23:03:33.526Z',
        deletedAt: null,
      },
      locationGroup: {
        id: 'locationgroup-Theatre1-tamanu',
        code: 'Theatre1',
        name: 'Operating Theatre',
        visibilityStatus: 'current',
        updatedAtSyncTick: '6528',
        createdAt: '2024-06-24T00:11:12.974Z',
        updatedAt: '2024-07-08T23:17:02.816Z',
        deletedAt: null,
        facilityId: 'facility-a',
      },
    },
  ];

  console.log('locations', locations);

  return (
    <Wrapper>
      <TopBar
        title={
          <TranslatedText
            stringId="scheduling.locationBookings.title"
            fallback="Location bookings"
          />
        }
      >
        <Filters>
          <Placeholder>Search</Placeholder>
          <Placeholder>Area</Placeholder>
          <Placeholder>Clinician</Placeholder>
          <Placeholder>Type</Placeholder>
        </Filters>
      </TopBar>
      <CalendarGrid
        style={{
          '--location-count': locations.length,
          '--week-count': 6,
        }}
      >
        {Array.from({ length: locations.length * 6 }, (_, i) => (
          <CalendarCell key={i} />
        ))}
      </CalendarGrid>
      {/* <Placeholder>LocationBookingsView</Placeholder> */}
    </Wrapper>
  );
};
