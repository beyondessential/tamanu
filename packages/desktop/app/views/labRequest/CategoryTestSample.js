import { Typography } from '@material-ui/core';
import React, { useState, useEffect, useCallback } from 'react';
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

const CategoryCell = styled(Cell)`
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

const HEADERS = [
  { name: 'Category', style: { paddingLeft: '32px' } },
  { name: 'Date & time collected' },
  { name: 'Collected by' },
  { name: 'Specimen type' },
  { name: 'Site' },
];

export const CategoryTestSampleField = ({
  categories,
  practitionerSuggester,
  specimenTypeSuggester,
  labSampleSiteSuggester,
  onCategorySampleChange,
}) => {
  const [categoryTestSample, setCategoryTestSample] = useState({});

  useEffect(() => {
    if (categoryTestSample && onCategorySampleChange) {
      onCategorySampleChange(categoryTestSample);
    }
  }, [categoryTestSample, onCategorySampleChange]);

  const setValue = useCallback(
    (category, key, value) => {
      setCategoryTestSample(previousState => {
        const previousCategoryValue = previousState[category.id] || {};
        return {
          ...previousState,
          [category.id]: { ...previousCategoryValue, [key]: value },
        };
      });
    },
    [setCategoryTestSample],
  );

  const removeSample = useCallback(
    category => {
      setCategoryTestSample(previousState => {
        const value = { ...previousState };
        delete value[category.id];
        return { ...value };
      });
    },
    [setCategoryTestSample],
  );

  const renderCategory = useCallback(
    (category, isLastCategory) => {
      const cellProps = { displayBorder: !isLastCategory };
      const isSampleCollected = categoryTestSample[category.id]?.sampleTime;

      return (
        <React.Fragment key={category.id}>
          <CategoryCell {...cellProps}>
            <Typography variant="subtitle1">{category.name}</Typography>
          </CategoryCell>
          <Cell {...cellProps}>
            <StyledField
              name={`sampleTime-${category.id}`}
              component={DateTimeField}
              max={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
              onChange={({ target: { value } }) => {
                if (value) {
                  setValue(category, 'sampleTime', value);
                } else {
                  removeSample(category);
                }
              }}
            />
          </Cell>
          <Cell {...cellProps}>
            <StyledField
              name={`collectedBy-${category.id}`}
              disabled={!isSampleCollected}
              component={AutocompleteField}
              suggester={practitionerSuggester}
              value={categoryTestSample[category.id]?.collectedBy}
              onChange={({ target: { value } }) => {
                setValue(category, 'collectedById', value);
              }}
            />
          </Cell>
          <Cell {...cellProps}>
            <StyledField
              name={`specimenType-${category.id}`}
              disabled={!isSampleCollected}
              component={AutocompleteField}
              suggester={specimenTypeSuggester}
              value={categoryTestSample[category.id]?.specimenType}
              onChange={({ target: { value } }) => {
                setValue(category, 'specimenTypeId', value);
              }}
            />
          </Cell>
          <Cell {...cellProps}>
            <StyledField
              name={`labSampleSiteSuggester-${category.id}`}
              disabled={!isSampleCollected}
              component={AutocompleteField}
              suggester={labSampleSiteSuggester}
              value={categoryTestSample[category.id]?.labSampleSite}
              onChange={({ target: { value } }) => {
                setValue(category, 'labSampleSiteId', value);
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
      categoryTestSample,
      removeSample,
      setValue,
    ],
  );

  return (
    <Container>
      {HEADERS.map(header => (
        <HeaderCell style={header.style} key={`header-${header.name}`}>
          {header.name}
        </HeaderCell>
      ))}
      {categories.map((category, index) => {
        const isLastCategory = categories.length - 1 === index;
        return renderCategory(category, isLastCategory);
      })}
    </Container>
  );
};
