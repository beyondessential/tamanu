import React from 'react';
import styled from 'styled-components';
import Box from '@material-ui/core/Box';
import { Button, OutlinedButton } from '../Button';
import { Form } from '../Field';
import { Colors } from '../../constants';

const Container = styled.div`
  border-bottom: 1px solid ${Colors.outline};
  background: ${Colors.white};
  padding: 16px 30px 28px;
`;

const SmallContainer = styled(Container)`
  font-size: 11px;
  .MuiInputBase-input {
    font-size: 11px;
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
  initialValues = {},
}) => {
  const ParentContainer = variant === 'small' ? SmallContainer : Container;

  return (
    <ParentContainer>
      <SectionLabel>{title}</SectionLabel>
      <Form
        onSubmit={onSearch}
        render={({ submitForm, clearForm }) => (
          <>
            <SearchInputContainer>{children}</SearchInputContainer>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              style={{ marginTop: 20 }}
            >
              {renderCheckField}
              <Box marginLeft="auto">
                <OutlinedButton style={{ marginRight: 12 }} onClick={clearForm}>
                  Clear search
                </OutlinedButton>
                <Button onClick={submitForm} type="submit">
                  Search
                </Button>
              </Box>
            </Box>
          </>
        )}
        initialValues={initialValues}
      />
    </ParentContainer>
  );
};
