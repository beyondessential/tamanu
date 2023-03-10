import React from 'react';
import styled from 'styled-components';
import ExpandMore from '@material-ui/icons/ExpandMore';
import { IconButton, Box } from '@material-ui/core';
import { Button } from '../Button';

export const SearchBarContainer = styled.div`
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

const ButtonsContainer = styled(Box)`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;

  .MuiIconButton-root {
    padding: 7px;
    margin-right: 3px;
  }

  .MuiButton-containedPrimary {
    flex: 1;
  }

  .MuiButton-containedPrimary,
  .MuiButton-textPrimary {
    padding-top: 9px;
    padding-bottom: 9px;
  }

  .MuiButton-textPrimary {
    text-decoration: underline;
    padding-left: 10px;
    padding-right: 5px;
    min-width: auto;
  }
`;

export const SearchBarSubmitButtons = ({ clearForm, clickToggle, ...props }) => {
  return (
    <ButtonsContainer {...props}>
      <IconButton onClick={clickToggle} color="primary">
        <ExpandMore />
      </IconButton>
      <Button type="submit">Search</Button>
      <Button variant="text" onClick={clearForm}>
        Clear
      </Button>
    </ButtonsContainer>
  );
};
