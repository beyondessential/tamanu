import React from 'react';
import styled from 'styled-components';
import { ButtonGroup, Typography } from '@material-ui/core';

import { Button, TopBar } from '../../components';
import { Colors } from '../../constants';

export const FilterPane = () => {
  return (
    <Container>
      <TopBar title="Appointments" />
      <ViewCalendarBy>
        <Typography variant="subtitle2">View calendar by:</Typography>
        <ButtonGroup>
          <Button color="primary" variant="contained">
            Locations
          </Button>
          <Button disabled>Clinicians</Button>
        </ButtonGroup>
      </ViewCalendarBy>
      <ViewBySelection>
        <Typography variant="subtitle2">Locations</Typography>
      </ViewBySelection>
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
  border-right: 1px solid ${Colors.outline};
`;

const ViewCalendarBy = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${Colors.outline};
`;

const ViewBySelection = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${Colors.outline};
  display: flex;
  flex-direction: column;
`;
