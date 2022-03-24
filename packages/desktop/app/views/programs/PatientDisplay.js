import React, { useCallback } from 'react';

import { useSelector, useDispatch } from 'react-redux';
import { Typography } from '@material-ui/core';

import { clearPatient, viewPatient } from 'desktop/app/store/patient';
import { OutlinedButton, Button } from 'desktop/app/components/Button';
import { PatientNameDisplay } from 'desktop/app/components/PatientNameDisplay';
import { history } from 'desktop/app/utils/utils';
import styled from 'styled-components';
import { Colors } from '../../constants';

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  padding: 24px;
  box-shadow: 0 1px 0 ${Colors.outline};
`;

const FlexRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: flex-start;
  column-gap: 0.5rem;
`;

const Heading = styled(Typography)`
  font-weight: 500;
  font-size: 24px;
  line-height: 28px;
`;

const LightText = styled(Typography)`
  position: relative;
  font-size: 13px;
  line-height: 15px;
  color: ${props => props.theme.palette.text.tertiary};
  top: -2px;
`;

export const PatientDisplay = ({ surveyCompleted = false }) => {
  const patient = useSelector(state => state.patient);
  const shouldShowCancel = !surveyCompleted;
  const dispatch = useDispatch();

  const onViewPatient = useCallback(() => {
    dispatch(viewPatient(patient.id));
  }, [patient.id, dispatch]);

  const onViewPatientKeyUp = useCallback(
    e => {
      if (e.code === 'Enter') {
        onViewPatient();
      }
    },
    [onViewPatient],
  );

  return (
    <Header>
      <FlexRow>
        <Heading variant="h3">
          <div tabIndex="0" role="button" onClick={onViewPatient} onKeyUp={onViewPatientKeyUp}>
            <PatientNameDisplay patient={patient} />
          </div>
        </Heading>
        <LightText>{`(${patient.displayId})`}</LightText>
      </FlexRow>
      <FlexRow>
        {shouldShowCancel && <Button onClick={history.goBack}>Cancel</Button>}
        <OutlinedButton
          onClick={() => {
            dispatch(clearPatient());
          }}
        >
          Change patient
        </OutlinedButton>
      </FlexRow>
    </Header>
  );
};
