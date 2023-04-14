import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Box } from '@material-ui/core';
import { Modal } from '../../Modal';
import { LabRequestPrintLabel } from '../printouts/LabRequestPrintLabel';
import { useLocalisation } from '../../../contexts/Localisation';
import { getPatientNameAsString } from '../../PatientNameDisplay';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 250px;
  padding-top: 10px;

  @media print {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-start;

    > div {
      margin: 15px;
    }
  }
`;

export const LabRequestPrintLabelModal = ({ open, onClose, labRequests }) => {
  const patient = useSelector(state => state.patient);
  const { getLocalisation } = useLocalisation();
  const labelWidth = getLocalisation('printMeasures.labRequestPrintLabel.width');

  return (
    <Modal title="Print label" width="md" open={open} onClose={onClose} printable>
      <Container>
        {labRequests.map(lab => (
          <Box mb={3}>
            <LabRequestPrintLabel
              printWidth={labelWidth}
              data={{
                patientName: getPatientNameAsString(patient),
                testId: lab.displayId,
                patientId: patient.displayId,
                patientDateOfBirth: patient.dateOfBirth,
                date: lab.sampleTime,
                labCategory: lab.category?.name,
              }}
            />
          </Box>
        ))}
      </Container>
    </Modal>
  );
};

LabRequestPrintLabelModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  labRequests: PropTypes.array.isRequired,
};
