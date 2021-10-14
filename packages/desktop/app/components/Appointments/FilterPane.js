import React from 'react';
import styled from 'styled-components';
import { ButtonGroup, Typography } from '@material-ui/core';

import { Button } from '../Button';
import { Colors, appointmentTypeOptions } from '../../constants';
import { Field, Form, AutocompleteField, MultiselectField } from '../Field';
import { Suggester } from '../../utils/suggester';
import { useApi } from '../../api';

const Section = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${Colors.outline};
  display: flex;
  flex-direction: column;
  form {
    margin-top: 1rem;
  }
`;

const FilterSwitch = styled(ButtonGroup)`
  margin-top: 0.5rem;
`;

export const FilterPane = ({
  filters,
  activeFilter,
  setActiveFilter,
  filterValue,
  setFilterValue,
  setAppointmentType,
}) => {
  const active = filters.find(filter => filter.name === activeFilter);
  const api = useApi();
  const suggesters = {
    location: new Suggester(api, 'location'),
    clinician: new Suggester(api, 'practitioner'),
  };
  return (
    <>
      <Section>
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
      </Section>
      <Section>
        <Typography variant="subtitle2">{active.text}</Typography>
        <Form
          render={() => (
            <Field
              name="filter"
              component={AutocompleteField}
              suggester={suggesters[active.name]}
              value={filterValue}
              onChange={e => {
                setFilterValue(e.target.value);
              }}
            />
          )}
        />
      </Section>
      <Section>
        <Typography variant="subtitle2">Appointment type</Typography>
        <Form
          render={() => (
            <Field
              name="appointment-type"
              component={MultiselectField}
              options={appointmentTypeOptions}
              onChange={e => {
                if (!e.target.value) {
                  setAppointmentType([]);
                  return;
                }
                setAppointmentType(e.target.value.split(','));
              }}
            />
          )}
        />
      </Section>
    </>
  );
};
