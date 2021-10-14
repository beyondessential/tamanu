import React from 'react';
import styled from 'styled-components';
import { ButtonGroup, Typography } from '@material-ui/core';

import { Button } from '../Button';
import { Colors } from '../../constants';

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

const FilterSwitch = styled(ButtonGroup)`
  margin-top: 0.5rem;
`;

export const FilterPane = ({ filters, activeFilter, setActiveFilter }) => {
  const active = filters.find(filter => filter.name === activeFilter);
  return (
    <>
      <ViewCalendarBy>
        <Typography variant="subtitle2">View calendar by:</Typography>
        <FilterSwitch>
          {filters.map(filter => (
            <Button
              color={filter.name === activeFilter ? 'primary' : null}
              variant={filter.name === activeFilter ? 'contained' : null}
              onClick={() => {
                setActiveFilter(filter.name);
              }}
            >
              {filter.text}
            </Button>
          ))}
        </FilterSwitch>
      </ViewCalendarBy>
      <ViewBySelection>
        <Typography variant="subtitle2">{active.text}</Typography>
      </ViewBySelection>
    </>
  );
};
