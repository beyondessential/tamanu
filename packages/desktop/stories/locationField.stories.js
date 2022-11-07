import React from 'react';
import styled from 'styled-components';
import Chance from 'chance';
import { storiesOf } from '@storybook/react';
import { Form, LocationInput } from '../app/components';
import { MockedApi } from './utils/mockedApi';

const Container = styled.div`
  padding: 1rem;
  max-width: 500px;
`;

const chance = new Chance();

function fakeCountry() {
  const id = chance.guid();
  const country = chance.country({ full: true });
  return { value: id, label: country };
}

function fakeCity(parentId) {
  const id = chance.guid();
  const city = chance.city();
  return { value: id, label: city, parentId };
}

const fakeLocations = [];

for (let i = 0; i < 10; i++) {
  const country = fakeCountry();
  fakeLocations.push(country);

  for (let j = 0; j < 20; j++) {
    const city = fakeCity(country.value);
    fakeLocations.push(city);
  }
}

const endpoints = {
  'locations/:id': () => {
    return fakeLocations;
  },
};

storiesOf('LocationField', module)
  .addDecorator(Story => (
    <MockedApi endpoints={endpoints}>
      <Story />
    </MockedApi>
  ))
  .add('Location search', () => {
    return (
      <Container>
        <Form
          render={() => {
            return (
              <div>
                <LocationField categoryLabel="Country" label="City" required />
              </div>
            );
          }}
        />
      </Container>
    );
  });
