import React, { useState } from 'react';
import styled from 'styled-components';
import Chance from 'chance';
import { storiesOf } from '@storybook/react';
import { Box } from '@material-ui/core';
import { Form, LocationInput } from '../app/components';
import { MockedApi } from './utils/mockedApi';

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-row-gap: 24px;
  padding: 1rem;
  max-width: 500px;
`;

const chance = new Chance();

function fakeCountry() {
  const id = chance.guid();
  const country = chance.country({ full: true });
  return { id, name: country };
}

function fakeCity(parentId) {
  const id = chance.guid();
  const city = chance.city();
  return { id, name: city, parentId };
}

const fakeLocations = [];

for (let i = 0; i < 10; i++) {
  const country = fakeCountry();
  fakeLocations.push(country);

  for (let j = 0; j < 20; j++) {
    const city = fakeCity(country.id);
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

// Todo: display in grid and list layouts
storiesOf('LocationField', module)
  .addDecorator(Story => (
    <MockedApi endpoints={endpoints}>
      <Story />
    </MockedApi>
  ))
  .add('Location search', () => {
    const [value, setValue] = useState('');

    const handleChange = event => {
      setValue(event.target.value);
    };

    const location = fakeLocations.find(x => x.id === value);

    return (
      <Container>
        <LocationInput
          categoryLabel="Country"
          label="City"
          value={value}
          onChange={handleChange}
          required
        />
        {location && <Box>Selected location: {location.name}</Box>}
      </Container>
    );
  });
