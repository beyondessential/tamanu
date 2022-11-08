import React, { useState } from 'react';
import styled from 'styled-components';
import Chance from 'chance';
import { storiesOf } from '@storybook/react';
import { Typography, Box } from '@material-ui/core';
import { LocationInput } from '../app/components';
import { MockedApi } from './utils/mockedApi';

const Container = styled.div`
  max-width: 600px;
  padding: 2rem;
`;

const TwoColumns = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-column-gap: 24px;
  margin-top: 10px;
  margin-bottom: 30px;
`;

const OneColumn = styled.div`
  display: grid;
  margin-top: 10px;
  grid-template-columns: 1fr;
  grid-row-gap: 24px;
`;

const chance = new Chance();

function fakeCountry() {
  const id = chance.guid();
  const country = chance.country({ full: true });
  return { id, name: country };
}

function fakeCity(locationGroup) {
  const id = chance.guid();
  const city = chance.city();
  const availability = chance.pickone(['AVAILABLE', 'RESERVED', 'OCCUPIED']);
  return { id, name: city, locationGroup, availability };
}

const fakeLocations = [];

for (let i = 0; i < 10; i++) {
  const country = fakeCountry();
  fakeLocations.push(country);

  for (let j = 0; j < 20; j++) {
    const city = fakeCity(country);
    fakeLocations.push(city);
  }
}

const endpoints = {
  'suggestions/location': () => {
    return fakeLocations;
  },
  'suggestions/location/:id': (data, id) => {
    return fakeLocations.find(x => x.id === id);
  },
};

storiesOf('LocationField', module)
  .addDecorator(Story => (
    <MockedApi endpoints={endpoints}>
      <Story />
    </MockedApi>
  ))
  .add('One Column', () => {
    const [value, setValue] = useState('');

    const handleChange = event => {
      setValue(event.target.value);
    };

    const location = fakeLocations.find(x => x.id === value);

    return (
      <Container>
        <Typography variant="h6">One Column</Typography>
        <OneColumn>
          <LocationInput
            categoryLabel="Country"
            label="City"
            value={value}
            onChange={handleChange}
            required
          />
        </OneColumn>
        <Box mt={5}>
          <Typography>Selected location</Typography>
          <Typography>{location && location.name}</Typography>
        </Box>
      </Container>
    );
  })
  .add('Two Columns', () => {
    const [value, setValue] = useState('');

    const handleChange = event => {
      setValue(event.target.value);
    };

    const location = fakeLocations.find(x => x.id === value);

    return (
      <Container>
        <Typography variant="h6">Two Columns</Typography>
        <TwoColumns>
          <LocationInput
            categoryLabel="Country"
            label="City"
            value={value}
            onChange={handleChange}
            required
          />
        </TwoColumns>
        <Box mt={5}>
          <Typography>Selected location</Typography>
          <Typography>{location && location.name}</Typography>
        </Box>
      </Container>
    );
  });
