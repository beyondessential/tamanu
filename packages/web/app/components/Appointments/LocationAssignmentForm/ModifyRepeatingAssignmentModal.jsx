import React, { useState } from 'react';
import styled from 'styled-components';
import { Radio, RadioGroup, FormControlLabel } from '@material-ui/core';

import { ConfirmModal } from '../../ConfirmModal';
import { TranslatedText } from '../../Translation';
import { Colors } from '../../../constants';
import { radioClasses } from '@mui/material';
import { BodyText } from '../../Typography';
import { MODIFY_REPEATING_ASSIGNMENT_MODE } from '../../../constants/locationAssignments';

const StyledConfirmModal = styled(ConfirmModal)`
  & .MuiPaper-root {
    max-width: 650px;
  }
`;

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36px 64px 24px;
  gap: 20px;
`;

const StyledRadioGroup = styled(RadioGroup)`
  gap: 0.75rem;
  width: 100%;
  padding: 12px;
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  background-color: ${Colors.white};
`;

const StyledRadio = styled(Radio)`
  &.${radioClasses.root} {
    color: ${Colors.primary};
    padding: 4px;
  }
  & svg {
    width: 15px;
    height: 15px;
  }
`;

const StyledFormControlLabel = styled(FormControlLabel)`
  margin-left: 0;
  & .MuiTypography-root {
    font-size: 14px;
    color: ${Colors.darkestText};
    margin-left: 4px;
  }
`;

export const ModifyRepeatingAssignmentModal = ({ open, onClose, onConfirm }) => {
  const [selectedMode, setSelectedMode] = useState(
    MODIFY_REPEATING_ASSIGNMENT_MODE.THIS_ASSIGNMENT,
  );

  return (
    <StyledConfirmModal
      open={open}
      onCancel={onClose}
      onConfirm={() => onConfirm(selectedMode)}
      title={
        <TranslatedText
          stringId={'locationAssignment.modal.modify.title'}
          fallback="Modify assignment"
        />
      }
      customContent={
        <Container>
          <BodyText color={Colors.darkestText}>
            <TranslatedText
              stringId={'locationAssignment.modal.modify.description'}
              fallback="This is a repeating assignment. Would you like to modify this assignment only or this assignment and future assignments as well?"
            />
          </BodyText>
          <StyledRadioGroup value={selectedMode} onChange={e => setSelectedMode(e.target.value)}>
            <StyledFormControlLabel
              control={
                <StyledRadio
                  value={MODIFY_REPEATING_ASSIGNMENT_MODE.THIS_ASSIGNMENT}
                  data-testid="styledradio-8447"
                />
              }
              label={
                <TranslatedText
                  stringId="locationAssignment.modal.modify.option.thisAssignment"
                  fallback="This assignment"
                  data-testid="translatedtext-jbfv"
                />
              }
              data-testid="styledformcontrollabel-eu1a"
            />
            <StyledFormControlLabel
              control={
                <StyledRadio
                  value={MODIFY_REPEATING_ASSIGNMENT_MODE.THIS_AND_FUTURE_ASSIGNMENTS}
                  data-testid="styledradio-n4ts"
                />
              }
              label={
                <TranslatedText
                  stringId="locationAssignment.modal.modify.option.thisAndFutureAssignments"
                  fallback="This and future assignments"
                  data-testid="translatedtext-pjx7"
                />
              }
              data-testid="styledformcontrollabel-spbk"
            />
          </StyledRadioGroup>
        </Container>
      }
      confirmButtonText={<TranslatedText stringId="general.action.continue" fallback="Continue" />}
    />
  );
};
