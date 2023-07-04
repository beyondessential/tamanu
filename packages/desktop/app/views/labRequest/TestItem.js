import React from 'react';
import styled from 'styled-components';
import Checkbox from '@material-ui/core/Checkbox';
import { FormControl, IconButton } from '@material-ui/core';
import { Close as CloseIcon } from '@material-ui/icons';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { Colors } from '../../constants';

export const StyledCheckboxControl = styled(Checkbox)`
  padding-top: 0;
  padding-bottom: 0;
  margin-left: 3px;
  display: inline-block;
`;

const StyledFormControlLabel = styled(FormControlLabel)`
  padding: 0.2rem 0;
  display: flex;
  i {
    font-size: 16px;
    line-height: 18px;
    color: #cccccc;
    &.fa-check-square {
      color: ${({ theme }) => theme.palette.primary.main};
    }
    &.fa-minus-square {
      color: ${({ theme }) => theme.palette.primary.main};
    }
  }
  .MuiFormControlLabel-label {
    display: flex;
    flex: 1;
  }
`;

const LabelText = styled.span`
  font-size: 15px;
  line-height: 18px;
  flex: 1;
  color: ${Colors.darkestText};
`;

const CategoryText = styled.span`
  font-size: 15px;
  line-height: 18px;
  color: ${Colors.softText};
`;

const RemoveIconButton = styled(IconButton)`
  padding: 0px;
  margin-left: 2rem;
  font-size: 18px;
  svg {
    color: #666666;
  }
`;

const TestItemWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: 0.2rem 0;
`;

const TestItemLabel = ({ label, category }) => (
  <>
    <LabelText>{label}</LabelText>
    {category && <CategoryText>{category}</CategoryText>}
  </>
);

export const SelectableTestItem = ({ name, label, category, checked, indeterminate, onChange }) => {
  return (
    <FormControl>
      <StyledFormControlLabel
        control={
          <StyledCheckboxControl
            icon={<i className="far fa-square" />}
            checkedIcon={<i className="far fa-check-square" />}
            indeterminateIcon={<i className="far fa-minus-square" />}
            indeterminate={indeterminate}
            color="primary"
            checked={checked}
            onChange={onChange}
            name={name}
          />
        }
        label={<TestItemLabel label={label} category={category} />}
      />
    </FormControl>
  );
};

export const TestItem = ({ label, name, category, onRemove }) => {
  const handleRemove = () => {
    onRemove({ target: { name, checked: false } });
  };
  return (
    <TestItemWrapper>
      <TestItemLabel label={label} category={category} />
      <RemoveIconButton onClick={handleRemove} color="primary">
        <CloseIcon fontSize="inherit" />
      </RemoveIconButton>
    </TestItemWrapper>
  );
};
