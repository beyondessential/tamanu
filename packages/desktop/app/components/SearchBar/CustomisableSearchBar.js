import React from 'react';
import styled from 'styled-components';
import Box from '@material-ui/core/Box';
import { IconButton } from '@material-ui/core';
import doubleDown from '../../assets/images/double_down.svg';
import doubleUp from '../../assets/images/double_up.svg';
import { LargeButton, TextButton } from '../Button';
import { Form } from '../Field';
import { Colors } from '../../constants';

const Container = styled.div`
  border-bottom: 1px solid ${Colors.outline};
  background: ${Colors.white};
  padding: 16px 30px 28px;
`;

const SmallContainer = styled(Container)`
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

const SectionLabel = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.theme.palette.text.primary};
  margin-bottom: 10px;
  letter-spacing: 0;
`;

const FilterContainer = styled(Box)`
  display: flex;
  justify-content: space-between;
`;

const SearchInputContainer = styled.div`
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

const SearchButton = styled(LargeButton)`
  margin-right: 20px;
  margin-left: 20px;
`;

const ClearButton = styled(TextButton)`
  text-decoration: underline;
`;
export const CustomisableSearchBar = ({
  title,
  onSearch,
  children,
  renderCheckField,
  variant = 'normal',
  showExpandButton = false,
  onExpandChange,
  initialValues = {},
}) => {
  const ParentContainer = variant === 'small' ? SmallContainer : Container;
  const [expanded, setExpanded] = React.useState(false);
  const switchExpandValue = React.useCallback(() => {
    setExpanded(previous => {
      const newValue = !previous;
      onExpandChange(newValue);
      return newValue;
    });
  }, [setExpanded, onExpandChange]);
  return (
    <ParentContainer>
      <SectionLabel>{title}</SectionLabel>
      <Form
        onSubmit={onSearch}
        render={({ submitForm, clearForm }) => (
          <FilterContainer>
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
          </FilterContainer>
        )}
        initialValues={initialValues}
      />
    </ParentContainer>
  );
};
