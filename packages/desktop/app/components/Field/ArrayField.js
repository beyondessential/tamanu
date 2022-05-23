import React from 'react';
import { FieldArray } from 'formik';
import styled from 'styled-components';
import { IconButton, Box } from '@material-ui/core';
import { AddCircleOutline, RemoveCircleOutline } from '@material-ui/icons';
import { generate } from 'shortid';
import { Field } from './Field';
import { AutocompleteField } from './AutocompleteField';
import { TimeWithUnitField } from './TimeWithUnitField';
import { Button } from '../Button';
import { Colors } from '../../constants';

const AddButton = styled(Button)`
  justify-self: start;
  padding-left: 10px;
  margin-top: -10px;
  margin-bottom: -20px;
`;

const RemoveButton = styled(IconButton)`
  position: relative;
  align-self: end;
  top: 4px;
  color: ${Colors.alert};
`;

const MAX_FIELDS = 4;

export const ArrayField = ({ form, icd10Suggester, field, label }) => {
  const fields = form.values.otherContributingConditions;
  return (
    <FieldArray name={field.name} validateOnChange={false}>
      {({ push, remove }) => (
        <>
          {fields.map(({ id }, index) => (
            <React.Fragment key={id}>
              <Field
                name={`${field.name}[${index}].cause`}
                label={label}
                component={AutocompleteField}
                suggester={icd10Suggester}
              />
              <Box display="flex" alignItems="flexEnd">
                <Field
                  name={`${field.name}[${index}].interval`}
                  label="Time between onset and death"
                  component={TimeWithUnitField}
                />
                {index > 0 && (
                  <RemoveButton onClick={() => remove(index)}>
                    <RemoveCircleOutline />
                  </RemoveButton>
                )}
              </Box>
            </React.Fragment>
          ))}
          {fields.length < MAX_FIELDS && (
            <AddButton
              startIcon={<AddCircleOutline />}
              type="button"
              color="primary"
              onClick={() => {
                push({ id: generate() });
              }}
            >
              Add additional
            </AddButton>
          )}
        </>
      )}
    </FieldArray>
  );
};
