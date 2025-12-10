import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { ButtonBase, Typography } from '@material-ui/core';
import { OutlinedButton, Modal, TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { isErrorUnknownAllow404s, useApi } from '../../../api';
import { useAuth } from '../../../contexts/Auth';
import { BookUserIcon } from '../../Icons/BookUserIcon';
import { PatientIDCardPage } from './PatientIDCardPage';
import { PatientStickerLabelPage } from './PatientStickerLabelPage';
import { CovidTestCertificateModal } from './CovidTestCertificateModal';
import { CovidClearanceCertificateModal } from './CovidClearanceCertificateModal';
import { BirthNotificationCertificateModal } from './BirthNotificationCertificateModal';
import { IPSQRCodeModal } from './IPSQRCodeModal';
import { SendToPatientModal } from './SendToPatientModal';
import { IdCardIcon } from '../icons/IdCardIcon';
import { MultilabelIdIcon } from '../icons/MultilabelIdIcon';
import { TestCertificateCovid19Icon } from '../icons/TestCertificateCovid19Icon';
import { ClearanceCertificateCovid19Icon } from '../icons/ClearanceCertificateCovid19Icon';
import { BirthNotificationIcon } from '../icons/BirthNotificationIcon';
import { InternationalPatientSummaryIcon } from '../icons/InternationalPatientSummaryIcon';
import { useSettings } from '../../../contexts/Settings';
import { PatientPortalIcon } from '../icons/PatientPortalIcon';

const PRINT_OPTIONS = {
  barcode: {
    label: (
      <TranslatedText
        stringId="patientDetails.resources.idLabels"
        fallback="Multiple ID labels"
        data-testid="translatedtext-35ln"
      />
    ),
    caption: (
      <TranslatedText
        stringId="patientDetails.resources.idLabels.caption"
        fallback="A4 sheet of multiple patient identification labels"
        data-testid="translatedtext-0v5t"
      />
    ),
    icon: MultilabelIdIcon,
    component: PatientStickerLabelPage,
  },
  idcard: {
    label: (
      <TranslatedText
        stringId="patientDetails.resources.idCard"
        fallback="ID Card"
        data-testid="translatedtext-nq3p"
      />
    ),
    caption: (
      <TranslatedText
        stringId="patientDetails.resources.idCard.caption"
        fallback="Patient identification card"
        data-testid="translatedtext-mxwh"
      />
    ),
    icon: IdCardIcon,
    component: PatientIDCardPage,
  },
  covidTestCert: {
    label: (
      <TranslatedText
        stringId="patientDetails.resources.covid19TestCertificate"
        fallback="Test certificate - COVID-19"
        data-testid="translatedtext-bymj"
      />
    ),
    caption: (
      <TranslatedText
        stringId="patientDetails.resources.covid19TestCertificate.caption"
        fallback="Patient COVID-19 test certificate"
        data-testid="translatedtext-phl1"
      />
    ),
    icon: TestCertificateCovid19Icon,
    component: CovidTestCertificateModal,
  },
  covidClearanceCert: {
    label: (
      <TranslatedText
        stringId="patientDetails.resources.covid19ClearanceCertificate"
        fallback="Clearance certificate - COVID-19"
        data-testid="translatedtext-xyy2"
      />
    ),
    caption: (
      <TranslatedText
        stringId="patientDetails.resources.covid19ClearanceCertificate.caption"
        fallback="Patient COVID-19 clearance certificate"
        data-testid="translatedtext-op82"
      />
    ),
    icon: ClearanceCertificateCovid19Icon,
    component: CovidClearanceCertificateModal,
    condition: getSetting => getSetting('features.enableCovidClearanceCertificate'),
  },
  birthNotification: {
    label: (
      <TranslatedText
        stringId="patientDetails.resources.birthNotification"
        fallback="Birth notification"
        data-testid="translatedtext-w370"
      />
    ),
    caption: (
      <TranslatedText
        stringId="patientDetails.resources.birthNotification.caption"
        fallback="Patient birth notification document"
        data-testid="translatedtext-3roq"
      />
    ),
    icon: BirthNotificationIcon,
    component: BirthNotificationCertificateModal,
  },
  ipsQrCode: {
    label: (
      <TranslatedText
        stringId="patientDetails.resources.internationalPatientSummary"
        fallback="International Patient Summary"
        data-testid="translatedtext-seoq"
      />
    ),
    caption: (
      <TranslatedText
        stringId="patientDetails.resources.internationalPatientSummary.caption"
        fallback="Email International Patient Summary QR Code"
        data-testid="translatedtext-y3mu"
      />
    ),
    // TODO: Replace with new icon
    icon: InternationalPatientSummaryIcon,
    component: IPSQRCodeModal,
    condition: (_, ability) => ability?.can('create', 'IPSRequest'),
  },
  patientPortalRegistration: {
    label: (
      <TranslatedText
        stringId="patientDetails.resources.patientPortalRegistration"
        fallback="Patient portal registration"
        data-testid="translatedtext-d74f"
      />
    ),
    caption: (
      <TranslatedText
        stringId="patientDetails.resources.patientPortalRegistration.caption"
        fallback="Set up patient portal access"
        data-testid="translatedtext-nvj2"
      />
    ),
    icon: PatientPortalIcon,
    component: SendToPatientModal,
    condition: (getSetting, ability) =>
      getSetting('features.patientPortal') && ability?.can('create', 'PatientPortalRegistration'),
  },
};

const PrintOptionList = ({ className, setCurrentlyPrinting, patient }) => {
  const { getSetting } = useSettings();
  const { ability } = useAuth();
  const isDeceased = Boolean(patient?.dateOfDeath);
  const isVisible = condition => !condition || condition(getSetting, ability);

  return (
    <div className={className}>
      <Header data-testid="header-cdy6">Identification</Header>
      <StyledPrintOptionsRow data-testid="styledprintoptionsrow-h1bq">
        {isVisible(PRINT_OPTIONS.idcard.condition) && (
          <PrintOption
            label={PRINT_OPTIONS.idcard.label}
            caption={PRINT_OPTIONS.idcard.caption}
            onPress={() => setCurrentlyPrinting('idcard')}
            icon={PRINT_OPTIONS.idcard.icon}
            data-testid="printoption-8zrr"
          />
        )}
        {isVisible(PRINT_OPTIONS.barcode.condition) && (
          <PrintOption
            label={PRINT_OPTIONS.barcode.label}
            caption={PRINT_OPTIONS.barcode.caption}
            onPress={() => setCurrentlyPrinting('barcode')}
            icon={PRINT_OPTIONS.barcode.icon}
            data-testid="printoption-nbx2"
          />
        )}
      </StyledPrintOptionsRow>
      <StyledDivider data-testid="styleddivider-ek66" />
      <Header data-testid="header-ibnn">Certificates</Header>
      <StyledPrintOptionsRow data-testid="styledprintoptionsrow-mkeg">
        {isVisible(PRINT_OPTIONS.birthNotification.condition) && (
          <PrintOption
            label={PRINT_OPTIONS.birthNotification.label}
            caption={PRINT_OPTIONS.birthNotification.caption}
            onPress={() => setCurrentlyPrinting('birthNotification')}
            icon={PRINT_OPTIONS.birthNotification.icon}
            data-testid="printoption-ihof"
          />
        )}
        {isVisible(PRINT_OPTIONS.covidTestCert.condition) && (
          <PrintOption
            label={PRINT_OPTIONS.covidTestCert.label}
            caption={PRINT_OPTIONS.covidTestCert.caption}
            onPress={() => setCurrentlyPrinting('covidTestCert')}
            icon={PRINT_OPTIONS.covidTestCert.icon}
            data-testid="printoption-a9l2"
          />
        )}
      </StyledPrintOptionsRow>
      <StyledPrintOptionsRow data-testid="styledprintoptionsrow-wp1y">
        {isVisible(PRINT_OPTIONS.covidClearanceCert.condition) && (
          <PrintOption
            label={PRINT_OPTIONS.covidClearanceCert.label}
            caption={PRINT_OPTIONS.covidClearanceCert.caption}
            onPress={() => setCurrentlyPrinting('covidClearanceCert')}
            icon={PRINT_OPTIONS.covidClearanceCert.icon}
            data-testid="printoption-fpqg"
          />
        )}
        {isVisible(PRINT_OPTIONS.ipsQrCode.condition) && (
          <PrintOption
            label={PRINT_OPTIONS.ipsQrCode.label}
            caption={PRINT_OPTIONS.ipsQrCode.caption}
            onPress={() => setCurrentlyPrinting('ipsQrCode')}
            icon={PRINT_OPTIONS.ipsQrCode.icon}
            data-testid="printoption-ssmc"
          />
        )}
      </StyledPrintOptionsRow>
      {isVisible(PRINT_OPTIONS.patientPortalRegistration.condition) && !isDeceased && (
        <>
          <StyledDivider data-testid="styleddivider-ds12" />
          <Header data-testid="header-kf7c">
            <TranslatedText
              stringId="patientDetails.resources.patientPortal.header"
              fallback="Patient portal"
            />
          </Header>
          <StyledPrintOptionsRow data-testid="styledprintoptionsrow-wp1y">
            <PrintOption
              label={PRINT_OPTIONS.patientPortalRegistration.label}
              caption={PRINT_OPTIONS.patientPortalRegistration.caption}
              onPress={() => setCurrentlyPrinting('patientPortalRegistration')}
              icon={PRINT_OPTIONS.patientPortalRegistration.icon}
              data-testid="printoption-8fsa"
            />
          </StyledPrintOptionsRow>
        </>
      )}
    </div>
  );
};

const StyledDivider = styled.div`
  height: 1px;
  background-color: ${Colors.outline};
  margin-top: 16px;
  margin-bottom: 22px;
`;

const StyledPrintOptionContainer = styled(PrintOptionList)`
  padding: 20px 50px;
  display: flex;
  flex-direction: column;
`;

const Header = styled.span`
  font-size: 16px;
  font-weight: 500;
  line-height: 21px;
  letter-spacing: 0px;
  text-align: left;
  color: ${Colors.darkestText};
`;

const StyledPrintOptionsRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  button:first-child {
    margin-right: 30px;
  }
`;

const StyledHeading = styled(Typography)`
  font-size: 16px;
  font-weight: 500;
  line-height: 21px;
  color: ${Colors.darkestText};
`;

const StyledSubHeading = styled(Typography)`
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.midText};
`;

const PrintOptionButton = styled(ButtonBase)`
  display: flex;
  justify-content: flex-start;
  padding: 20px 25px;
  height: 100px;
  width: 435px;
  margin: 14px 0;
  align-items: center;
  text-align: left;
  background: ${Colors.white};
  border: 2px solid ${Colors.outline};
  border-radius: 5px;
  color: ${Colors.primary};

  svg {
    width: 45px;
    margin-right: 15px;
  }

  &:hover {
    background: ${Colors.veryLightBlue};
  }
`;

const PrintOption = ({ label, caption, icon: Icon, onPress }) => (
  <PrintOptionButton onClick={onPress} data-testid="printoptionbutton-mdni">
    <Icon />
    <div>
      <StyledHeading component="div">{label}</StyledHeading>
      <StyledSubHeading component="div">{caption}</StyledSubHeading>
    </div>
  </PrintOptionButton>
);

async function getPatientProfileImage(api, patientId) {
  try {
    const { data } = await api.get(
      `patient/${patientId}/profilePicture`,
      {},
      { isErrorUnknown: isErrorUnknownAllow404s },
    );
    return data;
  } catch (e) {
    // 1x1 blank pixel
    return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  }
}

export const PrintPatientDetailsModal = ({ patient }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [printType, setPrintType] = useState(null);
  const [imageData, setImageData] = useState('');
  const api = useApi();

  const setCurrentlyPrinting = useCallback(
    async type => {
      setPrintType(type);
      setImageData('');
      if (type === 'idcard') {
        const data = await getPatientProfileImage(api, patient.id);
        setImageData(data);
      }
    },
    [api, patient.id],
  );

  const openModal = useCallback(() => {
    setModalOpen(true);
    setCurrentlyPrinting(null);
  }, [setCurrentlyPrinting]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, [setModalOpen]);

  // The print system & the modals both use React's portal functionality,
  // which unfortunately means a printed page will show up blank if any
  // modal is mounted - so when we are actually printing something,
  // we make sure to unmount the modal at the same time.
  const mainComponent = (() => {
    if (!printType) {
      // no selection yet -- show selection modal
      return (
        <Modal
          title={
            <TranslatedText
              stringId="patient.detailsSidebar.patientResources.modal.title"
              fallback="Patient resources"
            />
          }
          open={isModalOpen}
          onClose={closeModal}
          fullWidth={false}
          width={false}
          data-testid="modal-bsas"
        >
          <StyledPrintOptionContainer
            setCurrentlyPrinting={setCurrentlyPrinting}
            patient={patient}
            data-testid="styledprintoptioncontainer-e9vr"
          />
        </Modal>
      );
    }
    const Component = PRINT_OPTIONS[printType].component;
    const props = {
      patient,
    };

    if (printType === 'idcard') {
      // printing ID card -- if profile pic is ready we pass it as a prop
      // (triggered in the callback above)
      if (!imageData) {
        return (
          <Modal
            title={
              <TranslatedText
                stringId="patientDetails.resources.idCard.modal.submitting.title"
                fallback="Working"
                data-testid="translatedtext-sqfg"
              />
            }
            open
            data-testid="modal-2oz0"
          >
            <div>
              <TranslatedText
                stringId="patientDetails.resources.idCard.modal.submitting.loading"
                fallback="Preparing ID card..."
                data-testid="translatedtext-4b5u"
              />
            </div>
          </Modal>
        );
      }
      props.imageData = imageData;
    }
    return <Component {...props} data-testid="component-z2f2" />;
  })();

  return (
    <>
      <OutlinedButton onClick={openModal} data-testid="button-kdtv">
        <BookUserIcon
          htmlColor={Colors.primary}
          width={20}
          height={20}
          style={{ marginRight: 8 }}
        />
        <TranslatedText
          stringId="patient.detailsSidebar.action.patientResources"
          fallback="Patient resources"
          data-testid="translatedtext-wcdb"
        />
      </OutlinedButton>
      {mainComponent}
    </>
  );
};
