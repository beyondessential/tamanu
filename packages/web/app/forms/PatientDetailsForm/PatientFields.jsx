import React, { Fragment } from 'react';
import {
  Field,
  NumberField,
  TranslatedReferenceData,
  TranslatedText,
} from '../../components';
import { TextField, FormGrid } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';
import { PATIENT_FIELD_DEFINITION_TYPES } from '@tamanu/constants';
import { groupBy } from 'lodash';
import styled from 'styled-components';
import { TranslatedOptionSelectField } from '../../components/Translation/TranslatedOptions';

const StyledHeading = styled.div`
  font-weight: 500;
  font-size: 16px;
  color: ${Colors.darkText};
  margin-bottom: 30px;
`;

const StyledFormGrid = styled(FormGrid)`
  margin-bottom: 70px;
`;

// TODO: options not translatable in current implementation
export const PatientField = ({ definition: { definitionId, name, fieldType, options } }) => {
  // TODO: temporary placeholder component
  // the plan is to reuse the survey question components for these fields

  const label = (
    <TranslatedReferenceData
      category="patientFieldDefinition"
      value={definitionId}
      fallback={name}
    />
  );
  const fieldName = `patientFields.${definitionId}`;
  if (fieldType === PATIENT_FIELD_DEFINITION_TYPES.SELECT) {
    return (
      <Field
        name={fieldName}
        component={TranslatedOptionSelectField}
        referenceDataId={definitionId}
        referenceDataCategory="patientFieldDefinition"
        label={label}
        options={options}
        data-testid={`custom-patient-field-${definitionId}`}
      />
    );
  }
  if (fieldType === PATIENT_FIELD_DEFINITION_TYPES.STRING) {
    return (
      <Field
        name={fieldName}
        component={TextField}
        label={label}
        enablePasting
        data-testid={`custom-patient-field-${definitionId}`}
      />
    );
  }
  if (fieldType === PATIENT_FIELD_DEFINITION_TYPES.NUMBER) {
    return <Field name={fieldName} component={NumberField} label={name} data-testid="field-4rs2" />;
  }
  return (
    <p>
      <TranslatedText
        stringId="patientFields.error.unknownFieldType"
        fallback="Unknown field type: :fieldType"
        replacements={{ fieldType }}
        data-testid="translatedtext-unknown-field-type"
      />
    </p>
  );
};

export const PatientFieldsGroup = ({ fieldDefinitions, fieldValues }) => {
  const groupedFieldDefs = Object.entries(groupBy(fieldDefinitions, 'categoryId'));
  return (
    <div>
      {groupedFieldDefs.map(([categoryId, defs]) => (
        <Fragment key={categoryId} data-testid="fragment-e981">
          <StyledHeading data-testid="styledheading-5shc">
            <TranslatedReferenceData
              category="patientFieldDefinitionCategory"
              value={categoryId}
              fallback={defs[0].category}
            />
          </StyledHeading>
          <StyledFormGrid data-testid="styledformgrid-kotn">
            {defs.map(f => (
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
