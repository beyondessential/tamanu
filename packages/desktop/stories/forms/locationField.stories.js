import React from 'react';
import styled from 'styled-components';
import { storiesOf } from '@storybook/react';
import { Typography, Box } from '@material-ui/core';
import { Form, Field, LocationField } from '../../app/components';
import { fakeLocations } from '../../.storybook/__mocks__/defaultEndpoints';

/**
 * TODO: Semi-broken from changes to suggester logic
 */

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

storiesOf('LocationField', module)
  .add('One Column', () => {
    return (
      <Form
        render={({ values }) => {
          const location = fakeLocations.find(x => x.id === values.locationId);

          return (
            <Container>
              <Typography variant="h6">One Column</Typography>
              <OneColumn>
                <Field
                  component={LocationField}
                  locationGroupLabel="Area"
                  label="Location"
                  name="locationId"
                  required
                />
              </OneColumn>
              <Box mt={5}>
                <Typography>Selected location</Typography>
                <Typography>{location && location.name}</Typography>
              </Box>
            </Container>
          );
        }}
      />
    );
  })
  .add('Two Columns', () => {
    return (
      <Form
        render={({ values }) => {
          const location = fakeLocations.find(x => x.id === values.locationId);

          return (
            <Container>
              <Typography variant="h6">Two Columns</Typography>
              <TwoColumns>
                <Field
                  component={LocationField}
                  locationGroupLabel="Area"
                  label="Location"
                  name="locationId"
                  required
                />
              </TwoColumns>
              <Box mt={5}>
                <Typography>Selected location</Typography>
                <Typography>{location && location.name}</Typography>
              </Box>
            </Container>
          );
        }}
      />
    );
  });
