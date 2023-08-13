import React, { memo } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { CoreInfoDisplay } from './PatientCoreInfo';
import { PrintPatientDetailsModal } from '../PatientPrinting';
import { Colors } from '../../constants';

const PrintSection = memo(({ patient }) => <PrintPatientDetailsModal patient={patient} />);

const Container = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  background: ${Colors.white};
  box-shadow: 1px 0 3px rgba(0, 0, 0, 0.1);
  z-index: 10;
  overflow: auto;
`;

const ListsSection = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 0 auto;
  padding: 5px 25px 25px 25px;
`;

const Buttons = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;

  > button {
    margin-right: 10px;

    &:last-child {
      margin: 0;
    }
  }
`;

export const PatientInfoPane = () => {
  const patient = useSelector(state => state.patient);

  return (
    <Container>
      <CoreInfoDisplay patient={patient} />
      <ListsSection>
        <Buttons>
          <PrintSection patient={patient} />
        </Buttons>
      </ListsSection>
    </Container>
  );
};
