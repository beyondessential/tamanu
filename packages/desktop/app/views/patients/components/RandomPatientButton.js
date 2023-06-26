import React from 'react';
import styled from 'styled-components';
import { Chance } from 'chance';
import { Button } from '../../../components';
import { useLocalisation } from '../../../contexts/Localisation';
import { generate } from 'shortid';

const makeRandomPatient = generateId => {
  const chance = new Chance();
  const gender = chance.pickone(['male', 'female']);
  const title = gender === 'male' ? 'Mr' : chance.pickone(['Mrs', 'Ms']);
  const firstName = chance.first({ gender });
  const lastName = chance.last();
  return {
    displayId: generateId(),
    firstName,
    lastName,
    culturalName: chance.bool({ likelihood: 30 }) ? chance.last() : '',
    middleName: chance.bool({ likelihood: 60 }) ? chance.first({ gender }) : '',
    sex: gender,
    dateOfBirth: chance.birthday(),
    email: `${firstName}.${lastName}@randompatient.tamanu.io`.toLowerCase(),
    title,
  };
};

const RandomButtonStyled = styled(Button)`
  float: right;
  opacity: 0.0;
  &:hover {
    opacity: 1.0;
  }
`;

export const RandomPatientButton = ({ generateId, setValues }) => {
  const { getLocalisation } = useLocalisation();
  const allowGenerator = getLocalisation('features.quickPatientGenerator');

  if (!allowGenerator) {
    return null;
  }

  return (
    <RandomButtonStyled onClick={() => setValues(makeRandomPatient(generateId))}>
      Randomise
    </RandomButtonStyled>
  );
};
