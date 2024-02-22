import React, { useMemo } from 'react';
import * as yup from 'yup';
import { LAB_REQUEST_FORM_TYPES } from '@tamanu/constants/labs';
import { uniqBy } from 'lodash';
import styled from 'styled-components';
import { Field, TextField } from '../../components';
import { TestSelectorField } from '../../views/labRequest/TestSelector';
import { BodyText, Heading3 } from '../../components/Typography';
import { TranslatedText } from '../../components/Translation/TranslatedText';

const StyledBodyText = styled(BodyText)`
  margin-bottom: 28px;
  white-space: pre-line;
`;

export const screen2ValidationSchema = yup.object().shape({
  labTestTypeIds: yup
    .array()
    .nullable()
    .when('requestFormType', {
      is: val => val === LAB_REQUEST_FORM_TYPES.INDIVIDUAL,
      then: yup
        .array()
        .of(yup.string())
        .min(
          1,
          <TranslatedText
            stringId="lab.testSelect.individual.testTypes.validation"
            fallback="Please select at least one test type"
          />,
        ),
    }),
  panelIds: yup
    .array()
    .nullable()
    .when('requestFormType', {
      is: val => val === LAB_REQUEST_FORM_TYPES.PANEL,
      then: yup
        .array()
        .of(yup.string())
        .min(
          1,
          <TranslatedText
            stringId="lab.testSelect.panel.testTypes.validation"
            fallback="Please select at least one panel"
          />,
        ),
    }),
  notes: yup.string(),
});

export const FORM_TYPE_TO_FIELD_CONFIG = {
  [LAB_REQUEST_FORM_TYPES.INDIVIDUAL]: {
    subheading: (
      <TranslatedText
        stringId="lab.testSelect.individual.subheading"
        fallback="Select tests"
      />
    ),
    instructions: (
      <>
        <TranslatedText
          stringId="lab.testSelect.individual.instructionLine1"
          fallback="Please select the test or tests you would like to request below and add any relevant notes."
        />
        {'\n'}
        <TranslatedText
          stringId="lab.testSelect.individual.instructionLine2"
          fallback="You can filter test by category using the field below."
        />
      </>
    ),
    selectableName: 'test', // TODO: Translate selectableName (requires refactoring in TestSelector.js)
    fieldName: 'labTestTypeIds',
  },
  [LAB_REQUEST_FORM_TYPES.PANEL]: {
    subheading: (
      <TranslatedText stringId="lab.testSelect.panel.subheading" fallback="Select panel" />
    ),
    instructions: (
      <TranslatedText
        stringId="lab.testSelect.panel.instruction"
        fallback="Please select the panel or panels you would like to request below and add any relevant notes."
      />
    ),
    label: (
      <TranslatedText
        stringId="lab.testSelect.panel.label"
        fallback="Select the test panel or panels"
      />
    ),
    selectableName: 'panel',
    searchFieldPlaceholder: 'Search panel or category',
    fieldName: 'panelIds',
  },
  [LAB_REQUEST_FORM_TYPES.SUPERSET]: {
    subheading: (
      <TranslatedText
        stringId="lab.testSelect.superSet.subheading"
        fallback="Select superset"
      />
    ),
    instructions: (
      <>
        <TranslatedText
          stringId="lab.testSelect.superset.instructionLine1"
          fallback="Please select the superset you would like to request below and add any relevant notes."
        />
        ,{'\n'}
        <TranslatedText
          stringId="lab.testSelect.superset.instructionLine2"
          fallback="You can also remove or add additional panels to your request."
        />
      </>
    ),
    selectableName: 'panel',
  },
};

export const LabRequestFormScreen2 = props => {
  const {
    values: { requestFormType },
    onSelectionChange,
  } = props;

  const fieldConfig = useMemo(() => FORM_TYPE_TO_FIELD_CONFIG[requestFormType], [requestFormType]);
  const { subheading, instructions, fieldName } = fieldConfig;
  const handleSelectionChange = ({ selectedObjects }) => {
    if (!onSelectionChange) return;
    const isPanelRequest = requestFormType === LAB_REQUEST_FORM_TYPES.PANEL;
    const getKey = ({ category = {}, id }) => (isPanelRequest ? id : category.id);
    const grouped = uniqBy(selectedObjects, getKey).map(({ category = {}, id, name }) => ({
      categoryId: category.id,
      categoryName: category.name,
      ...(isPanelRequest ? { panelId: id, panelName: name } : {}),
    }));
    onSelectionChange(grouped);
  };

  return (
    <>
      <div style={{ gridColumn: '1 / -1' }}>
        <Heading3 mb="12px">{subheading}</Heading3>
        <StyledBodyText color="textTertiary">{instructions}</StyledBodyText>
        <Field
          name={fieldName}
          labelConfig={fieldConfig}
          component={TestSelectorField}
          requestFormType={requestFormType}
          onChange={handleSelectionChange}
          required
          {...props}
        />
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field
          name="notes"
          label={<TranslatedText stringId="general.notes.label" fallback="Notes" />}
          component={TextField}
          multiline
          rows={3}
        />
      </div>
    </>
  );
};
