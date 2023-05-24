import { Typography } from '@material-ui/core';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { format } from 'shared/utils/dateTime';
import { Heading4 } from '../../components';
import { DateTimeField, Field, AutocompleteField } from '../../components/Field';
import { Colors } from '../../constants';

const Container = styled.div`
  border: 1px solid ${Colors.outline};
  background: ${Colors.white};
  border-radius: 5px;
  display: grid;
  grid-template-columns: 230px 1fr 1fr 1fr 1fr;
  padding-bottom: 10px;
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

  border-bottom: ${props => (props.displayBorder ? `1px solid ${Colors.outline}` : 'none')};
`;

const SampleDetailsCell = styled(Cell)`
  padding: 10px 0;
  margin-left: 32px;
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

export const SampleDetailsField = ({
  labRequests,
  practitionerSuggester,
  specimenTypeSuggester,
  labSampleSiteSuggester,
  onCategorySampleChange: onSamplesChange,
}) => {
  const [samples, setSamples] = useState({});

  const hasPanels = useMemo(() => {
    return labRequests.some(request => request.panel);
  }, [labRequests]);

  const headers = useMemo(() => (hasPanels ? WITH_PANELS_HEADERS : HEADERS), [hasPanels]);

  useEffect(() => {
    if (samples && onSamplesChange) {
      onSamplesChange(samples);
    }
  }, [samples, onSamplesChange]);

  const setValue = useCallback(
    (category, key, value) => {
      setSamples(previousState => {
        const previousCategoryValue = previousState[category.id] || {};
        return {
          ...previousState,
          [category.id]: { ...previousCategoryValue, [key]: value },
        };
      });
    },
    [setSamples],
  );

  const removeSample = useCallback(
    key => {
      setSamples(previousState => {
        const value = { ...previousState };
        delete value[key];
        return { ...value };
      });
    },
    [setSamples],
  );

  const renderRequest = useCallback(
    (request, isLastRequest) => {
      const cellProps = { displayBorder: !isLastRequest };
      const key = `${request.categoryId}|${request.panelId}`;
      const isSampleCollected = samples[key]?.sampleTime;

      return (
        <React.Fragment key={key}>
          {hasPanels && (
            <SampleDetailsCell {...cellProps}>
              <Typography variant="subtitle1">{request.panelName}</Typography>
            </SampleDetailsCell>
          )}
          <SampleDetailsCell {...cellProps}>
            <Typography variant="subtitle1">{request.categoryName}</Typography>
          </SampleDetailsCell>
          <Cell {...cellProps}>
            <StyledField
              name={`sampleTime-${key}`}
              component={DateTimeField}
              max={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
              onChange={({ target: { value } }) => {
                if (value) {
                  setValue(request, 'sampleTime', value);
                } else {
                  removeSample(request);
                }
              }}
            />
          </Cell>
          <Cell {...cellProps}>
            <StyledField
              name={`collectedBy-${key}`}
              disabled={!isSampleCollected}
              component={AutocompleteField}
              suggester={practitionerSuggester}
              value={samples[key]?.collectedBy}
              onChange={({ target: { value } }) => {
                setValue(request, 'collectedById', value);
              }}
            />
          </Cell>
          <Cell {...cellProps}>
            <StyledField
              name={`specimenType-${key}`}
              disabled={!isSampleCollected}
              component={AutocompleteField}
              suggester={specimenTypeSuggester}
              value={samples[key]?.specimenType}
              onChange={({ target: { value } }) => {
                setValue(request, 'specimenTypeId', value);
              }}
            />
          </Cell>
          <Cell {...cellProps}>
            <StyledField
              name={`labSampleSiteSuggester-${key}`}
              disabled={!isSampleCollected}
              component={AutocompleteField}
              suggester={labSampleSiteSuggester}
              value={samples[key]?.labSampleSite}
              onChange={({ target: { value } }) => {
                setValue(request, 'labSampleSiteId', value);
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
    <Container>
      {headers.map((header, index) => (
        <HeaderCell style={index === 0 ? { paddingLeft: '32px' } : {}} key={`header-${header}`}>
          {header}
        </HeaderCell>
      ))}
      {labRequests.map((request, index) => {
        const isLastRequest = labRequests.length - 1 === index;
        return renderRequest(request, isLastRequest);
      })}
    </Container>
  );
};
