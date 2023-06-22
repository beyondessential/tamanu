import { Typography } from '@material-ui/core';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { Heading4 } from '../../components';
import { DateTimeField, Field, AutocompleteField } from '../../components/Field';
import { Colors } from '../../constants';

const Container = styled.div`
  border: 1px solid ${Colors.outline};
  background: ${Colors.white};
  border-radius: 5px;
  display: grid;
  grid-template-columns: ${props => (props.hasPanels ? 'repeat(6, 1fr)' : ' 230px repeat(4, 1fr)')};
  padding-bottom: 10px;

  > div:first-child {
    padding-left: 32px;
  }

  > div:nth-last-child(-n + ${props => (props.hasPanels ? '6' : '5')}) {
    border-bottom: none;
  }
`;

const HeaderCell = styled(Heading4)`
  font-size: 14px;
  padding: 15px 16px 15px 0px;
  border-bottom: 1px solid ${Colors.outline};
  color: ${Colors.midText};
`;

const Cell = styled.div`
  display: flex;
  padding: 10px 16px 10px 0px;
  align-items: center;
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
`;

const HEADERS = ['Category', 'Date & time collected', 'Collected by', 'Specimen type', 'Site'];
const WITH_PANELS_HEADERS = ['Panel', ...HEADERS];
export const SAMPLE_DETAILS_FIELD_PREFIX = 'sample-details-field-';

export const SampleDetailsField = ({
  initialSamples,
  practitionerSuggester,
  specimenTypeSuggester,
  labSampleSiteSuggester,
  onSampleChange,
}) => {
  const [samples, setSamples] = useState({});

  const hasPanels = useMemo(() => {
    return initialSamples.some(sample => sample.panelId);
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
      setSamples(previousState => {
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
    identifier => {
      setSamples(previousState => {
        const value = { ...previousState };
        delete value[identifier];
        return value;
      });
    },
    [setSamples],
  );

  const renderSampleDetails = useCallback(
    sample => {
      const identifier = hasPanels ? sample.panelId : sample.categoryId;
      const isSampleCollected = !!samples[identifier]?.sampleTime;

      return (
        <React.Fragment key={identifier}>
          {hasPanels && (
            <Cell style={{ marginLeft: '32px' }}>
              <Typography variant="subtitle1">{sample.panelName}</Typography>
            </Cell>
          )}
          <Cell style={!hasPanels ? { marginLeft: '32px' } : {}}>
            <Typography variant="subtitle1">{sample.categoryName}</Typography>
          </Cell>
          <Cell>
            <StyledField
              name={`${SAMPLE_DETAILS_FIELD_PREFIX}sampleTime-${identifier}`}
              component={DateTimeField}
              max={getCurrentDateTimeString()}
              saveDateAsString
              onChange={({ target: { value } }) => {
                if (value) {
                  setValue(identifier, 'sampleTime', value);
                } else {
                  removeSample(identifier);
                }
              }}
            />
          </Cell>
          <Cell>
            <StyledField
              name={`${SAMPLE_DETAILS_FIELD_PREFIX}collectedBy-${identifier}`}
              disabled={!isSampleCollected}
              component={AutocompleteField}
              suggester={practitionerSuggester}
              value={samples[identifier]?.collectedBy}
              onChange={({ target: { value } }) => {
                setValue(identifier, 'collectedById', value);
              }}
            />
          </Cell>
          <Cell>
            <StyledField
              name={`${SAMPLE_DETAILS_FIELD_PREFIX}specimenType-${identifier}`}
              disabled={!isSampleCollected}
              component={AutocompleteField}
              suggester={specimenTypeSuggester}
              value={samples[identifier]?.specimenType}
              onChange={({ target: { value } }) => {
                setValue(identifier, 'specimenTypeId', value);
              }}
            />
          </Cell>
          <Cell>
            <StyledField
              name={`${SAMPLE_DETAILS_FIELD_PREFIX}labSampleSiteSuggester-${identifier}`}
              disabled={!isSampleCollected}
              component={AutocompleteField}
              suggester={labSampleSiteSuggester}
              value={samples[identifier]?.labSampleSite}
              onChange={({ target: { value } }) => {
                setValue(identifier, 'labSampleSiteId', value);
              }}
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
    ],
  );

  return (
    <Container hasPanels={hasPanels}>
      {headers.map(columnName => (
        <HeaderCell key={`header-${columnName}`}>{columnName}</HeaderCell>
      ))}
      {initialSamples.map(request => {
        return renderSampleDetails(request);
      })}
    </Container>
  );
};
