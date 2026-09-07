import React from 'react';
import styled from 'styled-components';
import { BodyText } from '../../components/Typography';
import { Colors } from '../../constants';
import {
  AutocompleteField,
  DateTimeField,
  Field,
  FormSeparatorLine,
  SuggesterSelectField,
  TextField,
} from '../../components';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { CombinedTestSelector } from '../../views/labRequest/TestSelector';

const FieldGrid = styled.div`
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
`;

// If you update any fields please update screen1ValidationSchema in LabRequestMultiStepForm.js
export const LabRequestFormScreen1 = ({
  practitionerSuggester,
  departmentSuggester,
  isPriorityMandatory,
  onSelectionChange,
}) => (
  <>
    <div style={{ gridColumn: '1 / -1' }}>
      <BodyText
        mb="20px"
        fontWeight={500}
        style={{ color: Colors.darkText }}
        data-testid="lab-create-instruction"
      >
        <TranslatedText
          stringId="lab.create.instruction"
          fallback="Create a new lab request by completing the details below."
        />
      </BodyText>
    </div>
    <FieldGrid>
      <Field
        name="requestedById"
        label={
          <TranslatedText
            stringId="lab.requestingClinician.label"
            fallback="Requesting :clinician"
            replacements={{
              clinician: (
                <TranslatedText
                  stringId="general.localisedField.clinician.label.short"
                  fallback="Clinician"
                  casing="lower"
                />
              ),
            }}
          />
        }
        required
        component={AutocompleteField}
        suggester={practitionerSuggester}
        data-testid="field-requestedby"
      />
      <Field
        name="requestedDate"
        label={
          <TranslatedText stringId="general.requestDateTime.label" fallback="Request date & time" />
        }
        required
        component={DateTimeField}
        data-testid="field-requesteddate"
      />
      <Field
        name="departmentId"
        label={<TranslatedText stringId="general.department.label" fallback="Department" />}
        component={AutocompleteField}
        suggester={departmentSuggester}
        data-testid="field-department"
      />
      <Field
        name="labTestPriorityId"
        label={<TranslatedText stringId="lab.priority.label" fallback="Priority" />}
        required={isPriorityMandatory}
        component={SuggesterSelectField}
        endpoint="labTestPriority"
        data-testid="field-priority"
      />
    </FieldGrid>
    <div style={{ gridColumn: '1 / -1' }}>
      <FormSeparatorLine />
      <BodyText
        mb="12px"
        fontWeight={500}
        style={{ color: Colors.darkText }}
        data-testid="lab-testselect-heading"
      >
        <TranslatedText
          stringId="lab.testSelect.heading"
          fallback="Select the tests you would like to request"
        />
      </BodyText>
      <CombinedTestSelector onSelectionChange={onSelectionChange} />
    </div>
    <div style={{ gridColumn: '1 / -1' }}>
      <Field
        name="notes"
        label={<TranslatedText stringId="general.notes.label" fallback="Notes" />}
        component={TextField}
        multiline
        minRows={3}
        data-testid="field-notes"
      />
    </div>
  </>
);
