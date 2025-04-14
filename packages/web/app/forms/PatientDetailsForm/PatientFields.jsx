import React, { Fragment } from 'react';
import { Field, FormGrid, NumberField, SelectField, TextField } from '../../components';
import { PATIENT_FIELD_DEFINITION_TYPES } from '@tamanu/constants';
import { groupBy } from 'lodash';
import styled from 'styled-components';
import { Colors } from '../../constants';

const StyledHeading = styled.div`
  font-weight: 500;
  font-size: 16px;
  color: ${Colors.darkText};
  margin-bottom: 30px;
`;

const StyledFormGrid = styled(FormGrid)`
  margin-bottom: 70px;
`;

export const PatientField = ({ definition: { definitionId, name, fieldType, options } }) => {
  // TODO: temporary placeholder component
  // the plan is to reuse the survey question components for these fields
  const fieldName = `patientFields.${definitionId}`;
  if (fieldType === PATIENT_FIELD_DEFINITION_TYPES.SELECT) {
    const fieldOptions = options.map((o) => ({ label: o, value: o }));
    return (
      <Field
        name={fieldName}
        component={SelectField}
        label={name}
        options={fieldOptions}
        data-testid="field-32ps"
      />
    );
  }
  if (fieldType === PATIENT_FIELD_DEFINITION_TYPES.STRING) {
    return (
      <Field
        name={fieldName}
        component={TextField}
        label={name}
        enablePasting
        data-testid="field-gcal"
      />
    );
  }
  if (fieldType === PATIENT_FIELD_DEFINITION_TYPES.NUMBER) {
    return <Field name={fieldName} component={NumberField} label={name} data-testid="field-4rs2" />;
  }
  return <p>Unknown field type: {fieldType}</p>;
};

export const PatientFieldsGroup = ({ fieldDefinitions, fieldValues }) => {
  const groupedFieldDefs = Object.entries(groupBy(fieldDefinitions, 'category'));
  return (
    <div>
      {groupedFieldDefs.map(([category, defs]) => (
        <Fragment key={category} data-testid="fragment-e981">
          <StyledHeading data-testid="styledheading-5shc">{category}</StyledHeading>
          <StyledFormGrid data-testid="styledformgrid-kotn">
            {defs.map((f) => (
              <PatientField
                key={f.definitionId}
                definition={f}
                value={fieldValues ? fieldValues[f.definitionId] : ''}
                data-testid={`patientfield-6i02-${f.definitionId}`}
              />
            ))}
          </StyledFormGrid>
        </Fragment>
      ))}
    </div>
  );
};
