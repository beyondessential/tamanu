import React, { useState } from 'react';
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

export const FilterPane = () => {
  const filters = ['Locations', 'Clinicians'];

  const [activeFilter, setActiveFilter] = useState(0);

  return (
    <>
      <ViewCalendarBy>
        <Typography variant="subtitle2">View calendar by:</Typography>
        <FilterSwitch>
          {filters.map((filter, index) => (
            <Button
              color={index === activeFilter ? 'primary' : null}
              variant={index === activeFilter ? 'contained' : null}
              onClick={() => {
                setActiveFilter(index);
              }}
            >
              {filter}
            </Button>
          ))}
        </FilterSwitch>
      </ViewCalendarBy>
      <ViewBySelection>
        <Typography variant="subtitle2">{filters[activeFilter]}</Typography>
      </ViewBySelection>
    </>
  );
};
