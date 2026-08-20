import { Colors } from '../../constants/styles';
import { Typography } from '@material-ui/core';
import React, { useCallback, useEffect, useState } from 'react';
import { useFormikContext } from 'formik';
import styled from 'styled-components';
import { Heading4 } from '../../components';
import { RequiredOrnament, useDateTime } from '@tamanu/ui-components';
import { AutocompleteField, DateTimeField, Field } from '../../components/Field';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { TranslatedReferenceData } from '../../components/Translation/index.js';
import { SETTING_KEYS } from '@tamanu/constants';
import { useSettings } from '../../contexts/Settings';

export const SampleDetailsContainer = styled.div`
  border: 1px solid ${Colors.outline};
  background: ${Colors.white};
  border-radius: 5px;
  display: grid;
  grid-template-columns: 150px minmax(200px, 1fr) repeat(4, 1fr);
  padding-bottom: 10px;

  > div:nth-last-child(-n + 6) {
    border-bottom: none;
  }
`;

const HeaderCell = styled(Heading4)`
  font-size: 14px;
  padding: 15px 16px 15px 0px;
  border-bottom: 1px solid ${Colors.outline};
  color: ${Colors.midText};
  &:first-of-type {
    padding-left: 32px;
  }
`;

export const SampleDetailsCell = styled.div`
  display: flex;
  padding: 10px 16px 10px 0px;
  align-items: flex-start;
  > div {
    width: 100%;
  }

  border-bottom: 1px solid ${Colors.outline};
`;

export const SampleDetailsLabelCell = styled(SampleDetailsCell)`
  padding-left: 32px;
`;

export const SampleDetailsStyledField = styled(Field)`
  width: 100%;
  .Mui-disabled {
    background: ${Colors.softOutline};
    .MuiOutlinedInput-notchedOutline {
      border-color: #dedede;
    }
  }
  .MuiFormHelperText-root {
    background-color: white;
  }
`;

export const SampleDetailsDateTimeField = styled(Field)`
  width: 220px;
`;

export const SAMPLE_DETAILS_FIELD_PREFIX = 'sample-details-field-';

export const SampleDetailsHeaders = ({ mandateSpecimenType }) => (
  <>
    <HeaderCell data-testid="headercell-category">
      <TranslatedText stringId="lab.sampleDetail.table.column.category" fallback="Category" />
    </HeaderCell>
    <HeaderCell data-testid="headercell-test">
      <TranslatedText stringId="lab.sampleDetail.table.column.test" fallback="Test" />
    </HeaderCell>
    <HeaderCell data-testid="headercell-collectiondatetime">
      <TranslatedText
        stringId="lab.sampleDetail.table.column.collectionDateTime"
        fallback="Date & time collected"
      />
    </HeaderCell>
    <HeaderCell data-testid="headercell-collectedby">
      <TranslatedText
        stringId="lab.sampleDetail.table.column.collectedBy"
        fallback="Collected by"
      />
    </HeaderCell>
    <HeaderCell data-testid="headercell-specimentype">
      <TranslatedText
        stringId="lab.sampleDetail.table.column.specimenType"
        fallback="Specimen type"
      />
      {mandateSpecimenType && <RequiredOrnament />}
    </HeaderCell>
    <HeaderCell data-testid="headercell-site">
      <TranslatedText stringId="lab.site.label" fallback="Site" />
    </HeaderCell>
  </>
);

export const SampleDetailsField = ({
  initialSamples,
  practitionerSuggester,
  specimenTypeSuggester,
  labSampleSiteSuggester,
  onSampleChange,
}) => {
  const { getCurrentDateTime } = useDateTime();
  const { getSetting } = useSettings();
  const { setFieldValue } = useFormikContext();
  const mandateSpecimenType = getSetting(SETTING_KEYS.FEATURE_MANDATE_SPECIMEN_TYPE);

  const [samples, setSamples] = useState({});

  useEffect(() => {
    if (samples && onSampleChange) {
      onSampleChange(samples);
    }
  }, [samples, onSampleChange]);

  const setValue = useCallback(
    (categoryId, field, value) => {
      // This set uses the previous value in order to add the value in a map.
      // For instance, first time we call it with { categoryId: 'category-1', 'sampleTime', '2023-06-12 00:00 }
      // It's going to store in this state { category-1: { sampleTime: '2023-06-12 00:00'} }
      // Next time when it's called with the specimenType, it will be something like it: { categoryId: 'category-1', 'specimenType', 'specimen-type-id'}
      // we need to store that { category-1: { sampleTime: '2023-06-12 00:00', specimenType: 'specimen-type-id'} }
      setSamples(previousState => {
        const previousSample = previousState[categoryId] ?? {};
        return {
          ...previousState,
          [categoryId]: { ...previousSample, [field]: value },
        };
      });
    },
    [setSamples],
  );

  const removeSample = useCallback(
    categoryId => {
      setSamples(previousState => {
        const value = { ...previousState };
        delete value[categoryId];
        return value;
      });
    },
    [setSamples],
  );

  const renderSampleDetails = useCallback(
    sample => {
      const { categoryId } = sample;
      const isSampleCollected = Boolean(samples[categoryId]?.sampleTime);

      return (
        <React.Fragment key={categoryId}>
          <SampleDetailsLabelCell data-testid="cell-category">
            <Typography variant="subtitle1" data-testid="typography-category">
              {sample.category ? (
                <TranslatedReferenceData
                  category="labTestCategory"
                  value={sample.category.id}
                  fallback={sample.category.name}
                />
              ) : (
                <TranslatedText
                  stringId="lab.sampleDetail.uncategorised"
                  fallback="Uncategorised"
                />
              )}
            </Typography>
          </SampleDetailsLabelCell>
          <SampleDetailsCell data-testid="cell-test">
            <Typography variant="subtitle1" data-testid="typography-test">
              {sample.testNames.join(', ')}
            </Typography>
          </SampleDetailsCell>
          <SampleDetailsCell data-testid="cell-collectiondatetime">
            <SampleDetailsDateTimeField
              name={`${SAMPLE_DETAILS_FIELD_PREFIX}sampleTime-${categoryId}`}
              component={DateTimeField}
              max={getCurrentDateTime()}
              onChange={({ target: { value } }) => {
                if (value) {
                  setValue(categoryId, 'sampleTime', value);
                } else {
                  // Clearing the collection time abandons the whole sample. Also reset the sibling
                  // Formik fields so their stale values aren't validated (e.g. mandatory specimen
                  // type) or left displayed while the submitted sampleDetails no longer has them.
                  removeSample(categoryId);
                  setFieldValue(`${SAMPLE_DETAILS_FIELD_PREFIX}collectedBy-${categoryId}`, undefined);
                  setFieldValue(
                    `${SAMPLE_DETAILS_FIELD_PREFIX}specimenType-${categoryId}`,
                    undefined,
                  );
                  setFieldValue(
                    `${SAMPLE_DETAILS_FIELD_PREFIX}labSampleSiteSuggester-${categoryId}`,
                    undefined,
                  );
                }
              }}
              data-testid="styledfield-sampletime"
            />
          </SampleDetailsCell>
          <SampleDetailsCell data-testid="cell-collectedby">
            <SampleDetailsStyledField
              name={`${SAMPLE_DETAILS_FIELD_PREFIX}collectedBy-${categoryId}`}
              disabled={!isSampleCollected}
              component={AutocompleteField}
              suggester={practitionerSuggester}
              value={samples[categoryId]?.collectedBy ?? ''}
              onChange={({ target: { value } }) => {
                setValue(categoryId, 'collectedById', value);
              }}
              data-testid="styledfield-collectedby"
            />
          </SampleDetailsCell>
          <SampleDetailsCell data-testid="cell-specimentype">
            <SampleDetailsStyledField
              name={`${SAMPLE_DETAILS_FIELD_PREFIX}specimenType-${categoryId}`}
              disabled={!isSampleCollected}
              component={AutocompleteField}
              suggester={specimenTypeSuggester}
              value={samples[categoryId]?.specimenType ?? ''}
              onChange={({ target: { value } }) => {
                setValue(categoryId, 'specimenTypeId', value);
              }}
              data-testid="styledfield-specimentype"
            />
          </SampleDetailsCell>
          <SampleDetailsCell data-testid="cell-site">
            <SampleDetailsStyledField
              name={`${SAMPLE_DETAILS_FIELD_PREFIX}labSampleSiteSuggester-${categoryId}`}
              disabled={!isSampleCollected}
              component={AutocompleteField}
              suggester={labSampleSiteSuggester}
              value={samples[categoryId]?.labSampleSite ?? ''}
              onChange={({ target: { value } }) => {
                setValue(categoryId, 'labSampleSiteId', value);
              }}
              data-testid="styledfield-site"
            />
          </SampleDetailsCell>
        </React.Fragment>
      );
    },
    [
      labSampleSiteSuggester,
      specimenTypeSuggester,
      practitionerSuggester,
      samples,
      removeSample,
      setValue,
      setFieldValue,
      getCurrentDateTime,
    ],
  );

  return (
    <SampleDetailsContainer data-testid="container-qasv">
      <SampleDetailsHeaders mandateSpecimenType={mandateSpecimenType} />
      {initialSamples.map(renderSampleDetails)}
    </SampleDetailsContainer>
  );
};
