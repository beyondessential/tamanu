import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Box } from '@material-ui/core';
import { Modal } from '../../Modal';
import { LabRequestPrintLabel } from '../printouts/LabRequestPrintLabel';
import { getPatientNameAsString } from '../../PatientNameDisplay';
import { TranslatedText, TranslatedReferenceData } from '../../Translation';
import { useSettings } from '../../../contexts/Settings';

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
  const { getSetting } = useSettings()
  const labelWidth = getSetting('printMeasures.labRequestPrintLabel.width');

  return (
    <Modal
      title={<TranslatedText
        stringId="lab.modal.printLabel.title"
        fallback="Print label"
        data-testid='translatedtext-5n9c' />}
      width="md"
      open={open}
      onClose={onClose}
      printable
    >
      <Container>
        {labRequests.map(lab => (
          <Box key={lab.displayId} mb={3}>
            <LabRequestPrintLabel
              printWidth={labelWidth}
              data={{
                patientName: getPatientNameAsString(patient),
                testId: lab.displayId,
                patientId: patient.displayId,
                patientDateOfBirth: patient.dateOfBirth,
                date: lab.sampleTime,
                labCategory: lab.category
                  && <TranslatedReferenceData
                  fallback={lab.category.name}
                  value={lab.category.id}
                  category={lab.category.type}
                  data-testid='translatedreferencedata-68my' />,
                specimenType: lab.specimenType
                  && <TranslatedReferenceData
                  fallback={lab.specimenType.name}
                  value={lab.specimenType.id}
                  category={lab.specimenType.type}
                  data-testid='translatedreferencedata-rz1p' />
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
