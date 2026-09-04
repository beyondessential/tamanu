import { Colors } from '../../constants/styles';
import { Typography } from '@material-ui/core';
import React from 'react';
import { useFormikContext } from 'formik';
import styled, { css } from 'styled-components';
import { Heading4 } from '../../components';
import { RequiredOrnament, useDateTime } from '@tamanu/ui-components';
import { AutocompleteField, DateTimeInput, Field } from '../../components/Field';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { TranslatedReferenceData } from '../../components/Translation/index.js';
import { SETTING_KEYS } from '@tamanu/constants';
import { useAuth } from '../../contexts/Auth';
import { useSettings } from '../../contexts/Settings';

export const SampleDetailsContainer = styled.div`
  border: 1px solid ${Colors.outline};
  background: ${Colors.white};
  border-radius: 5px;
  display: grid;
  grid-template-columns: ${p =>
    p.$showTestColumns === false ? 'repeat(4, 1fr)' : '150px minmax(200px, 1fr) repeat(4, 1fr)'};
  padding-bottom: 10px;

  > div:nth-last-child(-n + ${p => (p.$showTestColumns === false ? 4 : 6)}) {
    border-bottom: none;
  }

  ${p =>
    p.$showTestColumns === false &&
    css`
      // No Category column to provide the left inset, so give the first column one to match.
      > div:nth-child(4n + 1) {
        padding-left: 32px;
      }
    `}
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

const SampleDetailsControlledDateTime = styled(DateTimeInput)`
  width: 220px;
`;

export const SampleDetailsHeaders = ({ mandateSpecimenType, showTestColumns = true }) => (
  <>
    {showTestColumns && (
      <>
        <HeaderCell data-testid="headercell-category">
          <TranslatedText stringId="lab.sampleDetail.table.column.category" fallback="Category" />
        </HeaderCell>
        <HeaderCell data-testid="headercell-test">
          <TranslatedText stringId="lab.sampleDetail.table.column.test" fallback="Test" />
        </HeaderCell>
      </>
    )}
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

export const SampleDetailsTable = ({
  samples,
  practitionerSuggester,
  specimenTypeSuggester,
  labSampleSiteSuggester,
}) => {
  const { getCurrentDateTime } = useDateTime();
  const { getSetting } = useSettings();
  const { currentUser } = useAuth();
  const { values, setFieldValue } = useFormikContext();
  const mandateSpecimenType = getSetting(SETTING_KEYS.FEATURE_MANDATE_SPECIMEN_TYPE);

  const sampleDetails = values.sampleDetails ?? {};

  return (
    <SampleDetailsContainer data-testid="container-qasv">
      <SampleDetailsHeaders mandateSpecimenType={mandateSpecimenType} />
      {samples.map(sample => {
        const { categoryId } = sample;
        const details = sampleDetails[categoryId];
        const isSampleCollected = Boolean(details?.sampleTime);
        const categoryField = `sampleDetails.${categoryId}`;

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
              <SampleDetailsControlledDateTime
                name={`sampleTime-${categoryId}`}
                value={details?.sampleTime ?? ''}
                max={getCurrentDateTime()}
                onChange={({ target: { value } }) => {
                  if (value) {
                    // A time makes the sample "collected". Default the collector to the current
                    // user the first time, keeping any fields already entered for this category.
                    setFieldValue(categoryField, {
                      ...details,
                      sampleTime: value,
                      collectedById: details?.collectedById ?? currentUser?.id,
                    });
                  } else {
                    // Clearing the time abandons the sample: drop the whole category entry so it is
                    // created as "sample not collected" and no stale sibling values are submitted.
                    setFieldValue(categoryField, undefined);
                  }
                }}
                data-testid="styledfield-sampletime"
              />
            </SampleDetailsCell>
            <SampleDetailsCell data-testid="cell-collectedby">
              <SampleDetailsStyledField
                name={`${categoryField}.collectedById`}
                disabled={!isSampleCollected}
                component={AutocompleteField}
                suggester={practitionerSuggester}
                data-testid="styledfield-collectedby"
              />
            </SampleDetailsCell>
            <SampleDetailsCell data-testid="cell-specimentype">
              <SampleDetailsStyledField
                name={`${categoryField}.specimenTypeId`}
                disabled={!isSampleCollected}
                component={AutocompleteField}
                suggester={specimenTypeSuggester}
                required={mandateSpecimenType}
                data-testid="styledfield-specimentype"
              />
            </SampleDetailsCell>
            <SampleDetailsCell data-testid="cell-site">
              <SampleDetailsStyledField
                name={`${categoryField}.labSampleSiteId`}
                disabled={!isSampleCollected}
                component={AutocompleteField}
                suggester={labSampleSiteSuggester}
                data-testid="styledfield-site"
              />
            </SampleDetailsCell>
          </React.Fragment>
        );
      })}
    </SampleDetailsContainer>
  );
};
