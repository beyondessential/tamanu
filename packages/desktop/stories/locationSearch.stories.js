import React, { useState } from 'react';
import styled from 'styled-components';
import Chance from 'chance';
import { storiesOf } from '@storybook/react';
import { LocationInput } from '../app/components';

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

storiesOf('LocationSearch', module).add('Location search', () => {
  const [value, setValue] = useState(null);

  const selectedOption = fakeLocations.find(x => x.value === value);

  return (
    <Container>
      <LocationInput
        groupLabel="Country"
        label="City"
        options={fakeLocations}
        onChange={setValue}
        required
      />
      {value && <div>Selected value: {selectedOption.label}</div>}
    </Container>
  );
});
