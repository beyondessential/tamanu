import React from 'react';
import styled from 'styled-components';
import { Box, Typography } from '@material-ui/core';
import { Field, Form, LocationField } from '../../app/components';
import { fakeLocations } from '../../.storybook/__mocks__/defaultEndpoints';

/**
 * TODO: Semi-broken from changes to suggester logic
 */

const Container = styled.div`
  max-width: 600px;
  padding: 2rem;
`;

const SingleColumn = styled.div`
  display: grid;
  margin-top: 10px;
  grid-template-columns: 1fr;
  grid-row-gap: 24px;
`;

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-column-gap: 24px;
  margin-top: 10px;
  margin-bottom: 30px;
`;

export default {
  title: 'LocationField',
  component: LocationField,
};

export const OneColumn = () => {
  return (
    <Form
      render={({ values }) => {
        const location = fakeLocations.find(x => x.id === values.locationId);

        return (
          <Container>
            <Typography variant="h6">One Column</Typography>
            <SingleColumn>
              <Field
                component={LocationField}
                locationGroupLabel="Area"
                label="Location"
                name="locationId"
                required
              />
            </SingleColumn>
            <Box mt={5}>
              <Typography>Selected location</Typography>
              <Typography>{location && location.name}</Typography>
            </Box>
          </Container>
        );
      }}
    />
  );
};

export const TwoColumns = () => {
  return (
    <Form
      render={({ values }) => {
        const location = fakeLocations.find(x => x.id === values.locationId);

        return (
          <Container>
            <Typography variant="h6">Two Columns</Typography>
            <TwoColumnGrid>
              <Field
                component={LocationField}
                locationGroupLabel="Area"
                label="Location"
                name="locationId"
                required
              />
            </TwoColumnGrid>
            <Box mt={5}>
              <Typography>Selected location</Typography>
              <Typography>{location && location.name}</Typography>
            </Box>
          </Container>
        );
      }}
    />
  );
};
