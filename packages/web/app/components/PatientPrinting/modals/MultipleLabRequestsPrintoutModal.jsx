import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';

import { useDateTimeFormat } from '@tamanu/ui-components';

import { Modal } from '../../Modal';
import { useCertificate } from '../../../utils/useCertificate';
import { useApi } from '../../../api';
import { Colors } from '../../../constants';
import { PDFLoader, printPDF } from '../PDFLoader';
import { useTranslation } from '../../../contexts/Translation';
import { useSettings } from '../../../contexts/Settings';
import { MultipleLabRequestsPrintout } from '@tamanu/shared/utils/patientCertificates';
import { TranslatedText } from '../../Translation/TranslatedText';
import { usePatientAdditionalDataQuery } from '../../../api/queries';

export const MultipleLabRequestsPrintoutModal = ({ encounter, labRequests, open, onClose }) => {
  const api = useApi();
  const { getTranslation } = useTranslation();
  const { getSetting } = useSettings();
  const { countryTimeZone } = useDateTimeFormat();
  const { data: certificateData, isFetching: isCertificateFetching } = useCertificate();

  const { data: patient, isLoading: isPatientLoading } = useQuery(
    ['patient', encounter.patientId],
    () => api.get(`patient/${encodeURIComponent(encounter.patientId)}`),
  );

  const {
    data: additionalData,
    isLoading: isAdditionalDataLoading,
  } = usePatientAdditionalDataQuery(encounter.patientId);

  const { data: village = {}, isLoading: isVillageQueryLoading } = useQuery(
    ['village', encounter.patientId],
    () => api.get(`referenceData/${encodeURIComponent(patient.villageId)}`),
    {
      enabled: !!patient?.villageId,
    },
  );

  const isVillageLoading = isVillageQueryLoading && !!patient?.villageId;
  const isLoading =
    isPatientLoading || isAdditionalDataLoading || isVillageLoading || isCertificateFetching;

  return (
    <Modal
      title={
        <TranslatedText
          stringId="lab.modal.printMultiple.title"
          fallback="Print lab requests"
          data-testid="translatedtext-9eip"
        />
      }
      width="md"
      open={open}
      onClose={onClose}
      color={Colors.white}
      printable
      onPrint={() => printPDF('lab-request-printout')}
      data-testid="modal-bsyg"
    >
      <PDFLoader isLoading={isLoading} id="lab-request-printout" data-testid="pdfloader-1ibd">
        <MultipleLabRequestsPrintout
          certificateData={certificateData}
          patientData={{ ...patient, additionalData, village }}
          encounter={encounter}
          labRequests={labRequests}
          getTranslation={getTranslation}
          getSetting={getSetting}
          countryTimeZone={countryTimeZone}
          data-testid="multiplelabrequestsprintout-fhui"
        />
      </PDFLoader>
    </Modal>
  );
};

MultipleLabRequestsPrintoutModal.propTypes = {
  encounter: PropTypes.object.isRequired,
  labRequests: PropTypes.array.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
