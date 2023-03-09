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

const SearchInputContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 2fr);
  gap: 9px;
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
          <Box display="flex" justifyContent="space-between">
            <SearchInputContainer>{children}</SearchInputContainer>
            <Box
              display="flex"
              alignItems="center"
              flexDirection="column"
              justifyContent="space-between"
              style={{ marginTop: 20, marginLeft: 8, paddingBottom: 12 }}
            >
              <Box display="flex">
                {showExpandButton && (
                  <IconButton
                    onClick={() => {
                      switchExpandValue();
                    }}
                    color="primary"
                    style={{ padding: '6px 14px' }}
                  >
                    <img
                      src={expanded ? doubleUp : doubleDown}
                      alt={`${expanded ? 'hide' : 'show'} advanced filters`}
                    />
                  </IconButton>
                )}
                <LargeButton
                  style={{ marginRight: 20, marginLeft: 20 }}
                  onClick={submitForm}
                  type="submit"
                >
                  Search
                </LargeButton>
                <TextButton onClick={clearForm} style={{ textDecoration: 'underline' }}>
                  Clear
                </TextButton>
              </Box>
              {renderCheckField}
            </Box>
          </Box>
        )}
        initialValues={initialValues}
      />
    </ParentContainer>
  );
};
