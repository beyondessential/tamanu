import { Colors } from '../../constants/styles';
import { Typography } from '@material-ui/core';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Heading4 } from '../../components';
import { useDateTimeFormat } from '@tamanu/ui-components';
import { AutocompleteField, DateTimeField, Field } from '../../components/Field';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { SETTING_KEYS } from '@tamanu/constants';
import { useSettings } from '../../contexts/Settings';
import { TranslatedReferenceData } from '../../components/Translation/index.js';

const Container = styled.div`
  border: 1px solid ${Colors.outline};
  background: ${Colors.white};
  border-radius: 5px;
  display: grid;
  grid-template-columns: ${(props) =>
    props.hasPanels ? 'repeat(6, 1fr)' : ' 230px repeat(4, 1fr)'};
  padding-bottom: 10px;

  > div:nth-last-child(-n + ${(props) => (props.hasPanels ? '6' : '5')}) {
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

const Cell = styled.div`
  display: flex;
  padding: 10px 16px 10px 0px;
  align-items: flex-start;
  > div {
    width: 100%;
  }

  border-bottom: 1px solid ${Colors.outline};
`;

const StyledField = styled(Field)`
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

export const SAMPLE_DETAILS_FIELD_PREFIX = 'sample-details-field-';

export const SampleDetailsField = ({
  initialSamples,
  practitionerSuggester,
  specimenTypeSuggester,
  labSampleSiteSuggester,
  onSampleChange,
}) => {
  const { getFacilityCurrentDateTimeInputValue } = useDateTimeFormat();
  const { getSetting } = useSettings();
  const mandateSpecimenType = getSetting(SETTING_KEYS.FEATURE_MANDATE_SPECIMEN_TYPE);

  const HEADERS = [
    <TranslatedText
      key="category"
      stringId="lab.sampleDetail.table.column.category"
      fallback="Category"
      data-testid="translatedtext-r56z"
    />,
    <TranslatedText
      key="dateTimeCollected"
      stringId="lab.sampleDetail.table.column.collectionDateTime"
      fallback="Date & time collected"
      data-testid="translatedtext-2dwc"
    />,
    <TranslatedText
      key="dateTimeCollected"
      stringId="lab.sampleDetail.table.column.collectedBy"
      fallback="Collected by"
      data-testid="translatedtext-xd1n"
    />,
    <>
      <TranslatedText
        key="specimentType"
        stringId="lab.sampleDetail.table.column.specimenType"
        fallback="Specimen type"
        data-testid="translatedtext-tznt"
      />
      {mandateSpecimenType && <span style={{ color: Colors.alert }}> *</span>}
    </>,
    <TranslatedText
      key="site"
      stringId="lab.site.label"
      fallback="Site"
      data-testid="translatedtext-umcq"
    />,
  ];
  const WITH_PANELS_HEADERS = [
    <TranslatedText
      key="panel"
      stringId="lab.sampleDetail.table.column.panel"
      fallback="Panel"
      data-testid="translatedtext-8f07"
    />,
    ...HEADERS,
  ];

  const [samples, setSamples] = useState({});

  const hasPanels = useMemo(() => {
    return initialSamples.some((sample) => sample.panelId);
  }, [initialSamples]);

  const headers = useMemo(() => (hasPanels ? WITH_PANELS_HEADERS : HEADERS), [hasPanels]);

  useEffect(() => {
    if (samples && onSampleChange) {
      onSampleChange(samples);
    }
  }, [samples, onSampleChange]);

  const setValue = useCallback(
    (identifier, field, value) => {
      // This set uses the previous value in order to add the value in a map.
      // For instance, first time we call it with { identifier: 'category-1', 'sampleTime', '2023-06-12 00:00 }
      // It's going to store in this state { category-1: { sampleTime: '2023-06-12 00:00'} }
      // Next time when it's called with the specimenType, it will be something like it: { identifier: 'category-1', 'specimenType', 'specimen-type-id'}
      // we need to store that { category-1: { sampleTime: '2023-06-12 00:00', specimenType: 'specimen-type-id'} }
      setSamples((previousState) => {
        const previousSample = previousState[identifier] || {};
        return {
          ...previousState,
          [identifier]: { ...previousSample, [field]: value },
        };
      });
    },
    [setSamples],
  );

  const removeSample = useCallback(
    (identifier) => {
      setSamples((previousState) => {
        const value = { ...previousState };
        delete value[identifier];
        return value;
      });
    },
    [setSamples],
  );

  const renderSampleDetails = useCallback(
    (sample) => {
      const identifier = hasPanels ? sample.panelId : sample.categoryId;
      const isSampleCollected = !!samples[identifier]?.sampleTime;

      return (
        <React.Fragment key={identifier} data-testid="fragment-lxar">
          {hasPanels && (
            <Cell style={{ marginLeft: '32px' }} data-testid="cell-ow83">
              <Typography variant="subtitle1" data-testid="typography-ex0x">
                <TranslatedReferenceData
                  category="labTestPanel"
                  fallback={sample.panelName}
                  value={sample.panelId}
                  data-testid="translatedreferencedata-xa5y"
                />
              </Typography>
            </Cell>
          )}
          <Cell style={!hasPanels ? { marginLeft: '32px' } : {}} data-testid="cell-xzhc">
            <Typography variant="subtitle1" data-testid="typography-772r">
              {sample.categoryName}
            </Typography>
          </Cell>
          <Cell data-testid="cell-o2z5">
            <StyledField
              name={`${SAMPLE_DETAILS_FIELD_PREFIX}sampleTime-${identifier}`}
              component={DateTimeField}
              max={getFacilityCurrentDateTimeInputValue()}
              saveDateAsString
              onChange={({ target: { value } }) => {
                if (value) {
                  setValue(identifier, 'sampleTime', value);
                } else {
                  removeSample(identifier);
                }
              }}
              data-testid="styledfield-ratc"
            />
          </Cell>
          <Cell data-testid="cell-3kij">
            <StyledField
              name={`${SAMPLE_DETAILS_FIELD_PREFIX}collectedBy-${identifier}`}
              disabled={!isSampleCollected}
              component={AutocompleteField}
              suggester={practitionerSuggester}
              value={samples[identifier]?.collectedBy}
              onChange={({ target: { value } }) => {
                setValue(identifier, 'collectedById', value);
              }}
              data-testid="styledfield-wifm"
            />
          </Cell>
          <Cell data-testid="cell-pbcg">
            <StyledField
              name={`${SAMPLE_DETAILS_FIELD_PREFIX}specimenType-${identifier}`}
              disabled={!isSampleCollected}
              component={AutocompleteField}
              suggester={specimenTypeSuggester}
              value={samples[identifier]?.specimenType}
              onChange={({ target: { value } }) => {
                setValue(identifier, 'specimenTypeId', value);
              }}
              data-testid="styledfield-8g4b"
            />
          </Cell>
          <Cell data-testid="cell-fr2g">
            <StyledField
              name={`${SAMPLE_DETAILS_FIELD_PREFIX}labSampleSiteSuggester-${identifier}`}
              disabled={!isSampleCollected}
              component={AutocompleteField}
              suggester={labSampleSiteSuggester}
              value={samples[identifier]?.labSampleSite}
              onChange={({ target: { value } }) => {
                setValue(identifier, 'labSampleSiteId', value);
              }}
              data-testid="styledfield-mog8"
            />
          </Cell>
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
      hasPanels,
      getFacilityCurrentDateTimeInputValue,
    ],
  );

  return (
    <Container hasPanels={hasPanels} data-testid="container-qasv">
      {headers.map((columnName, index) => (
        <HeaderCell key={`header-${index}`} data-testid={`headercell-vhy0-${index}`}>
          {columnName}
        </HeaderCell>
      ))}
      {initialSamples.map((request) => {
        return renderSampleDetails(request);
      })}
    </Container>
  );
};
