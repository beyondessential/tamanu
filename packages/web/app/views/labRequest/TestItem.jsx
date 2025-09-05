import React from 'react';
import styled from 'styled-components';
import Checkbox from '@mui/material/Checkbox';
import { FormControl, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import FormControlLabel from '@mui/material/FormControlLabel';
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
  font-size: 14px;
  line-height: 18px;
  flex: 1;
  color: ${Colors.darkestText};
`;

const CategoryText = styled.span`
  font-size: 14px;
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
    <LabelText data-testid="labeltext-6stl">{label}</LabelText>
    {category && <CategoryText data-testid="categorytext-jno3">{category}</CategoryText>}
  </>
);

export const SelectableTestItem = ({ name, label, category, checked, indeterminate, onChange }) => {
  return (
    <FormControl data-testid="formcontrol-cng3">
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
            data-testid="styledcheckboxcontrol-6oiy"
          />
        }
        label={<TestItemLabel label={label} category={category} data-testid="testitemlabel-a7ol" />}
        data-testid="styledformcontrollabel-ywrq"
      />
    </FormControl>
  );
};

export const TestItem = ({ label, name, category, onRemove }) => {
  const handleRemove = () => {
    onRemove({ target: { name, checked: false } });
  };
  return (
    <TestItemWrapper data-testid="testitemwrapper-o7ha">
      <TestItemLabel label={label} category={category} data-testid="testitemlabel-ypgb" />
      <RemoveIconButton onClick={handleRemove} color="primary" data-testid="removeiconbutton-iwj5">
        <CloseIcon fontSize="inherit" data-testid="closeicon-mfuk" />
      </RemoveIconButton>
    </TestItemWrapper>
  );
};
