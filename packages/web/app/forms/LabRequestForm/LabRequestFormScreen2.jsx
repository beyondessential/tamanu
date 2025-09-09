import React, { useMemo } from 'react';
import { LAB_REQUEST_FORM_TYPES } from '@tamanu/constants/labs';
import { uniqBy } from 'lodash';
import styled from 'styled-components';
import { TextField } from '@tamanu/ui-components';
import { Field } from '../../components';
import { TestSelectorField } from '../../views/labRequest/TestSelector';
import { BodyText, Heading3 } from '../../components/Typography';
import { TranslatedText, TranslatedReferenceData } from '../../components/Translation';

const StyledBodyText = styled(BodyText)`
  margin-bottom: 28px;
  white-space: pre-line;
`;

export const FORM_TYPE_TO_FIELD_CONFIG = {
  [LAB_REQUEST_FORM_TYPES.INDIVIDUAL]: {
    subheading: (
      <TranslatedText
        stringId="lab.testSelect.individual.subheading"
        fallback="Select tests"
        data-testid="translatedtext-rk4l"
      />
    ),
    instructions: (
      <>
        <TranslatedText
          stringId="lab.testSelect.individual.instructionLine1"
          fallback="Please select the test or tests you would like to request below and add any relevant notes."
          data-testid="translatedtext-9b03"
        />
        {'\n'}
        <TranslatedText
          stringId="lab.testSelect.individual.instructionLine2"
          fallback="You can filter test by category using the field below."
          data-testid="translatedtext-rwjv"
        />
      </>
    ),
    selectableName: 'test', // TODO: Translate selectableName (requires refactoring in TestSelector.js)
    fieldName: 'labTestTypeIds',
  },
  [LAB_REQUEST_FORM_TYPES.PANEL]: {
    subheading: (
      <TranslatedText
        stringId="lab.testSelect.panel.subheading"
        fallback="Select panel"
        data-testid="translatedtext-t0mp"
      />
    ),
    instructions: (
      <TranslatedText
        stringId="lab.testSelect.panel.instruction"
        fallback="Please select the panel or panels you would like to request below and add any relevant notes."
        data-testid="translatedtext-9045"
      />
    ),
    label: (
      <TranslatedText
        stringId="lab.testSelect.panel.label"
        fallback="Select the test panel or panels"
        data-testid="translatedtext-tole"
      />
    ),
    selectableName: 'panel',
    searchFieldPlaceholder: {
      stringId: 'lab.testSelect.placeholder',
      fallback: 'Search panel or category',
    },
    fieldName: 'panelIds',
  },
  [LAB_REQUEST_FORM_TYPES.SUPERSET]: {
    subheading: (
      <TranslatedText
        stringId="lab.testSelect.superSet.subheading"
        fallback="Select superset"
        data-testid="translatedtext-7fho"
      />
    ),
    instructions: (
      <>
        <TranslatedText
          stringId="lab.testSelect.superset.instructionLine1"
          fallback="Please select the superset you would like to request below and add any relevant notes."
          data-testid="translatedtext-vg31"
        />
        ,{'\n'}
        <TranslatedText
          stringId="lab.testSelect.superset.instructionLine2"
          fallback="You can also remove or add additional panels to your request."
          data-testid="translatedtext-f06l"
        />
      </>
    ),
    selectableName: 'panel',
  },
};

export const LabRequestFormScreen2 = (props) => {
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
      categoryName: (
        <TranslatedReferenceData
          fallback={category.name}
          value={category.id}
          category={category.type}
          data-testid={`translatedreferencedata-obh3-${category.code}`}
        />
      ),
      ...(isPanelRequest ? { panelId: id, panelName: name } : {}),
    }));
    onSelectionChange(grouped);
  };

  return (
    <>
      <div style={{ gridColumn: '1 / -1' }}>
        <Heading3 mb="12px" data-testid="heading3-keat">
          {subheading}
        </Heading3>
        <StyledBodyText color="textTertiary" data-testid="styledbodytext-8egc">
          {instructions}
        </StyledBodyText>
        <Field
          name={fieldName}
          labelConfig={fieldConfig}
          component={TestSelectorField}
          requestFormType={requestFormType}
          onChange={handleSelectionChange}
          required
          {...props}
          data-testid="field-0id0"
        />
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field
          name="notes"
          label={
            <TranslatedText
              stringId="general.notes.label"
              fallback="Notes"
              data-testid="translatedtext-nr6q"
            />
          }
          component={TextField}
          multiline
          minRows={3}
          data-testid="field-3t0x"
        />
      </div>
    </>
  );
};
