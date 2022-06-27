import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Typography } from '@material-ui/core';

import { viewPatient } from 'desktop/app/store/patient';
import { Button } from 'desktop/app/components/Button';
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

const Heading = styled(Typography)`
  font-weight: 500;
  font-size: 24px;
  line-height: 28px;

  &:hover {
    cursor: pointer;
  }
`;

const LightText = styled.span`
  vertical-align: middle;
  font-size: 13px;
  line-height: 15px;
  color: ${props => props.theme.palette.text.tertiary};
  margin-left: 5px;
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
      <div>
        <Heading
          variant="h3"
          tabIndex="0"
          role="button"
          onClick={onViewPatient}
          onKeyUp={onViewPatientKeyUp}
        >
          <PatientNameDisplay patient={patient} />
          <LightText>({patient.displayId})</LightText>
        </Heading>
      </div>
      {shouldShowCancel && <Button onClick={history.goBack}>Cancel</Button>}
    </Header>
  );
};
