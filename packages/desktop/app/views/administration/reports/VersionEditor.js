import React from 'react';
import styled from 'styled-components';
import { Button, CardItem, OutlinedButton, formatShort, formatTime } from '../../../components';
import { Colors } from '../../../constants';
import { NewReportView } from './NewReportView';

const ButtonContainer = styled.div`
  display: flex;
  align-items: center;
  padding-left: 20px;
  padding-right: 20px;
  > :first-child {
    margin-right: 10px;
  }
`;

const StyledButton = styled(OutlinedButton)`
  background: ${Colors.white};

  &.Mui-disabled {
    border-color: ${Colors.outline};
  }
`;

export const VersionEditor = ({ report, version, onBack, onSave }) => {
  const { queryOptions, ...rest } = version;

  return (
    <>
      <ButtonContainer>
        <StyledButton onClick={onBack}>Back</StyledButton>
      </ButtonContainer>

      <NewReportView version={{ ...queryOptions, ...rest }} report={report} />
    </>
  );
};
