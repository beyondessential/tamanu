import React from 'react';
import styled from 'styled-components';
import { Box, Typography } from '@material-ui/core';
import { Form } from '@tamanu/ui-components';
import { Field, LocationField } from '../../app/components';
import { fakeLocations } from '../../.storybook/__mocks__/defaultEndpoints';

/**
 * TODO: Semi-broken from changes to suggester logic
 */

const Container = styled.div`
  max-width: 600px;
  padding: 2rem;
`;

const OneColumnLayout = styled.div`
  display: grid;
  margin-top: 10px;
  grid-template-columns: 1fr;
  grid-row-gap: 24px;
`;

const TwoColumnsLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-column-gap: 24px;
  margin-top: 10px;
  margin-bottom: 30px;
`;

export default {
  title: 'LocationField',
};

export const OneColumn = () => {
  return (
    <Form
      onSubmit={() => { }}
      render={({ values }) => {
        const location = fakeLocations.find(x => x.id === values.locationId);

        return (
          <Container>
            <Typography variant="h6">One Column</Typography>
            <OneColumnLayout>
              <Field
                component={LocationField}
                locationGroupLabel="Area"
                label="Location"
                name="locationId"
                required
              />
            </OneColumnLayout>
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
      onSubmit={() => { }}
      render={({ values }) => {
        const location = fakeLocations.find(x => x.id === values.locationId);

        return (
          <Container>
            <Typography variant="h6">Two Columns</Typography>
            <TwoColumnsLayout>
              <Field
                component={LocationField}
                locationGroupLabel="Area"
                label="Location"
                name="locationId"
                required
              />
            </TwoColumnsLayout>
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
