import React, { memo } from 'react';

import { connect } from 'react-redux';
import { Typography } from '@material-ui/core';

import { clearPatient } from 'desktop/app/store/patient';
import { OutlinedButton } from 'desktop/app/components/Button';
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
  margin-left: 8px;
  top: -2px;
`;

export const PatientDisplay = connect(
  state => ({ patient: state.patient }),
  dispatch => ({ onClearPatient: () => dispatch(clearPatient()) }),
)(
  memo(({ patient, onClearPatient }) => {
    const patientInfo = `${patient.firstName} ${patient.lastName} (${patient.displayId})`;

    return (
      <Header>
        <FlexRow>
          <Heading variant="h3">{`${patient.firstName} ${patient.lastName}`}</Heading>
          <LightText>({patient.displayId})</LightText>
        </FlexRow>
        <OutlinedButton onClick={onClearPatient}>Change patient</OutlinedButton>
      </Header>
    );
  }),
);
