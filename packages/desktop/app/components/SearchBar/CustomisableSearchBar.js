import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import Box from '@material-ui/core/Box';
import { IconButton } from '@material-ui/core';
import doubleDown from '../../assets/images/double_down.svg';
import doubleUp from '../../assets/images/double_up.svg';
import { Button, TextButton } from '../Button';
import { Form } from '../Field';
import { Colors } from '../../constants';

const Container = styled.div`
  border: 1px solid ${Colors.outline};
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  background: ${Colors.white};
  padding: 16px 30px 20px;
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

const SearchInputContainer = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 2fr);
  gap: 9px;
`;

const ActionsContainer = styled(Box)`
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: space-between;
  margin-top: 20px;
  margin-left: 8px;
  padding-bottom: 12px;
`;

const ExpandButton = styled(IconButton)`
  padding: 6px 14px;
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
  renderCheckField,
  showExpandButton = false,
  onExpandChange,
  initialValues = {},
}) => {
  const [expanded, setExpanded] = useState(false);

  const switchExpandValue = useCallback(() => {
    setExpanded(previous => {
      const newValue = !previous;
      onExpandChange(newValue);
      return newValue;
    });
  }, [setExpanded, onExpandChange]);

  return (
    <Container>
      <Form
        onSubmit={onSearch}
        render={({ submitForm, clearForm }) => (
          <Box display="flex" justifyContent="space-between">
            <SearchInputContainer>{children}</SearchInputContainer>
            <ActionsContainer>
              <Box display="flex">
                {showExpandButton && (
                  <ExpandButton
                    onClick={() => {
                      switchExpandValue();
                    }}
                    color="primary"
                  >
                    <img
                      src={expanded ? doubleUp : doubleDown}
                      alt={`${expanded ? 'hide' : 'show'} advanced filters`}
                    />
                  </ExpandButton>
                )}
                <SearchButton onClick={submitForm} type="submit">
                  Search
                </SearchButton>
                <ClearButton onClick={clearForm}>Clear</ClearButton>
              </Box>
              {renderCheckField}
            </ActionsContainer>
          </Box>
        )}
        initialValues={initialValues}
      />
    </Container>
  );
};
