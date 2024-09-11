import Chance from 'chance';
import React from 'react';
import styled from 'styled-components';

import { Colors } from '../../constants';
import { useApi } from '../../api';
import { PageContainer, TOP_BAR_HEIGHT, TopBar, TranslatedText } from '../../components';

// BEGIN PLACEHOLDERS

const chance = new Chance();

const locations = Array(12).map(() => ({
  id: chance.guid(),
  code: chance.string(),
  name: chance.string(),
  locationGroupId: chance.guid(),
}));

const Placeholder = styled.div`
  background-color: oklch(0% 0 0 / 3%);
  block-size: 100%;
  border: 1px solid magenta;
  color: oklch(0% 0 0 / 55%);
  display: grid;
  font-size: 2rem;
  inline-size: 100%;
  place-items: center;
  text-align: center;
`;

// END PLACEHOLDERS

const Wrapper = styled(PageContainer)`
  display: grid;
  grid-template-rows: min-content auto;
`;

export const LocationBookingsView = () => {
  const api = useApi();

  console.log('locations', locations);

  return (
    <Wrapper>
      <TopBar title={<TranslatedText stringId="" fallback="Location bookings" />} />
      <Placeholder>LocationBookingsView</Placeholder>
      {/* <Placeholder>LocationBookingsView</Placeholder> */}
    </Wrapper>
  );
};
