import React, { useCallback } from 'react';
import styled from 'styled-components';
import Box from '@material-ui/core/Box';
import { IconButton } from '@material-ui/core';
import doubleDown from '../../assets/images/double_down.svg';
import doubleUp from '../../assets/images/double_up.svg';
import { Button, TextButton } from '../Button';
import { Form } from '../Field';
import { Colors, FORM_TYPES } from '../../constants';

const Container = styled.div`
  border: 1px solid ${Colors.outline};
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  background: ${Colors.white};
  padding: 16px 25px 10px;
  font-size: 11px;

  .MuiInputBase-input,
  .MuiFormControlLabel-label {
    font-size: 11px;
  }

  .MuiButtonBase-root {
    font-size: 14px;
  }

  .label-field {
    font-size: 11px;
  }

  .display-field {
    .MuiSvgIcon-root {
      font-size: 16px;
    }
  }
`;

const CustomisableSearchBarGrid = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: repeat(5, 2fr);
  gap: 10px;
  margin-bottom: 16px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(4, 2fr);
  }
`;

const ActionsContainer = styled(Box)`
  display: flex;
  align-items: center;
  margin-top: 20px;
  margin-left: 8px;
`;

const SearchButton = styled(Button)`
  margin-right: 20px;
  margin-left: 6px;
`;

const ClearButton = styled(TextButton)`
  text-decoration: underline;
`;

export const CustomisableSearchBar = ({
  onSearch,
  children,
  showExpandButton = false,
  isExpanded,
  setIsExpanded,
  initialValues = {},
  staticValues = {},
  hiddenFields,
}) => {
  const switchExpandValue = useCallback(() => {
    setIsExpanded(previous => {
      setIsExpanded(!previous);
    });
  }, [setIsExpanded]);

  const handleSubmit = values => {
    onSearch({ ...values, ...staticValues });
  };

  return (
    <Form
      onSubmit={handleSubmit}
      render={({ clearForm, values }) => (
        <Container>
          <CustomisableSearchBarGrid>
            {children}
            <ActionsContainer>
              {showExpandButton && (
                <IconButton
                  onClick={() => {
                    switchExpandValue();
                  }}
                  color="primary"
                >
                  <img
                    src={isExpanded ? doubleUp : doubleDown}
                    alt={`${isExpanded ? 'hide' : 'show'} advanced filters`}
                  />
                </IconButton>
              )}
              <SearchButton type="submit">Search</SearchButton>
              <ClearButton
                onClick={() => {
                  // Cant check for dirty as form is reinitialized with persisted values
                  if (Object.keys(values).length === 0) return;
                  onSearch({});
                  // ClearForm needed to be deferred in order ensure that it re-initializes to an empty
                  // state rather than the previous state
                  setTimeout(() => clearForm(), 0);
                }}
              >
                Clear
              </ClearButton>
            </ActionsContainer>
          </CustomisableSearchBarGrid>
          {isExpanded && <CustomisableSearchBarGrid>{hiddenFields}</CustomisableSearchBarGrid>}
        </Container>
      )}
      initialValues={initialValues}
      enableReinitialize
      formType={FORM_TYPES.SEARCH_FORM}
    />
  );
};
