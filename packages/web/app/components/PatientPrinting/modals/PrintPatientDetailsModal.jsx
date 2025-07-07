import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { Modal } from '../../Modal';
import { Button } from '../../Button';
import { Colors } from '../../../constants';
import { isErrorUnknownAllow404s, useApi } from '../../../api';
import { useAuth } from '../../../contexts/Auth';

import { PatientIDCardPage } from './PatientIDCardPage';
import { PatientStickerLabelPage } from './PatientStickerLabelPage';
import { CovidTestCertificateModal } from './CovidTestCertificateModal';
import { CovidClearanceCertificateModal } from './CovidClearanceCertificateModal';
import { BirthNotificationCertificateModal } from './BirthNotificationCertificateModal';
import { TranslatedText } from '../../Translation/TranslatedText';
import { IPSQRCodeModal } from './IPSQRCodeModal';
import { IdCardIcon } from '../icons/IdCardIcon';
import { MultilabelIdIcon } from '../icons/MultilabelIdIcon';
import { TestCertificateCovid19Icon } from '../icons/TestCertificateCovid19Icon';
import { ClearanceCertificateCovid19Icon } from '../icons/ClearanceCertificateCovid19Icon';
import { BirthNotificationIcon } from '../icons/BirthNotificationIcon';
import { InternationalPatientSummaryIcon } from '../icons/InternationalPatientSummaryIcon';
import { useSettings } from '../../../contexts/Settings';

const PRINT_OPTIONS = {
  barcode: {
    label: (
      <TranslatedText
        stringId="patientDetails.print.action.idLabels"
        fallback="Multiple ID labels"
        data-testid="translatedtext-35ln"
      />
    ),
    caption: (
      <TranslatedText
        stringId="patientDetails.print.action.idLabels.caption"
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
        stringId="patientDetails.print.action.idCard"
        fallback="ID Card"
        data-testid="translatedtext-nq3p"
      />
    ),
    caption: (
      <TranslatedText
        stringId="patientDetails.print.action.idCard.caption"
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
        stringId="patientDetails.print.action.covid19TestCertificate"
        fallback="Test certificate - COVID-19"
        data-testid="translatedtext-bymj"
      />
    ),
    caption: (
      <TranslatedText
        stringId="patientDetails.print.action.covid19TestCertificate.caption"
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
        stringId="patientDetails.print.action.covid19ClearanceCertificate"
        fallback="Clearance certificate - COVID-19"
        data-testid="translatedtext-xyy2"
      />
    ),
    caption: (
      <TranslatedText
        stringId="patientDetails.print.action.covid19ClearanceCertificate.caption"
        fallback="Patient COVID-19 clearance certificate"
        data-testid="translatedtext-op82"
      />
    ),
    icon: ClearanceCertificateCovid19Icon,
    component: CovidClearanceCertificateModal,
    condition: (getSetting) => getSetting('features.enableCovidClearanceCertificate'),
  },
  birthNotification: {
    label: (
      <TranslatedText
        stringId="patientDetails.print.action.birthNotification"
        fallback="Birth notification"
        data-testid="translatedtext-w370"
      />
    ),
    caption: (
      <TranslatedText
        stringId="patientDetails.print.action.birthNotification.caption"
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
        stringId="patientDetails.print.action.internationalPatientSummary"
        fallback="International Patient Summary"
        data-testid="translatedtext-seoq"
      />
    ),
    caption: (
      <TranslatedText
        stringId="patientDetails.print.action.internationalPatientSummary.caption"
        fallback="Email International Patient Summary QR Code"
        data-testid="translatedtext-y3mu"
      />
    ),
    icon: InternationalPatientSummaryIcon,
    component: IPSQRCodeModal,
    condition: (_, ability) => ability?.can('create', 'IPSRequest'),
  },
};

const PrintOptionList = ({ className, setCurrentlyPrinting }) => {
  const { getSetting } = useSettings();
  const { ability } = useAuth();

  const isVisible = (condition) => !condition || condition(getSetting, ability);

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

const PrintOptionButton = styled(Button)`
  background: ${Colors.white};
  border: 2px solid ${Colors.outline};
  border-radius: 5px;
  color: ${Colors.primary};

  &:hover {
    background: ${Colors.veryLightBlue};
  }

  justify-content: center;
  text-align: -webkit-center;

  height: 100px;
  width: 435px;
  margin: 14px 0px;
  .MuiButton-label {
    .Container {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
      width: 435px;
      .Icon {
        width: 20%;
        height: 43px;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
      }
      .Title {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        align-self: baseline;
        margin-top: 5px;
        width: 80%;
        .Heading {
          font-size: 16px;
          font-weight: 500;
          line-height: 21px;
          letter-spacing: 0px;
          text-align: left;
          color: ${Colors.darkestText};
        }
        .SubHeading {
          font-size: 14px;
          font-weight: 400;
          line-height: 18px;
          letter-spacing: 0px;
          text-align: left;
          color: ${Colors.midText};
        }
      }
    }
  }
`;

const PrintOption = ({ label, caption, icon: Icon, onPress }) => (
  <PrintOptionButton color="default" onClick={onPress} data-testid="printoptionbutton-mdni">
    <div className="Container">
      <div className="Icon">
        <Icon data-testid="icon-z3qm" />
      </div>
      <div className="Title">
        <div className="Heading">{label}</div>
        <div className="SubHeading">{caption}</div>
      </div>
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
    async (type) => {
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
          title="Select item"
          open={isModalOpen}
          onClose={closeModal}
          fullWidth={false}
          width={false}
          data-testid="modal-bsas"
        >
          <StyledPrintOptionContainer
            setCurrentlyPrinting={setCurrentlyPrinting}
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
                stringId="patientDetails.print.idCard.modal.submitting.title"
                fallback="Working"
                data-testid="translatedtext-sqfg"
              />
            }
            open
            data-testid="modal-2oz0"
          >
            <div>
              <TranslatedText
                stringId="patientDetails.print.idCard.modal.submitting.loading"
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
      <Button size="small" onClick={openModal} data-testid="button-kdtv">
        <TranslatedText
          stringId="patient.detailsSidebar.action.patientResources"
          fallback="Patient resources"
          data-testid="translatedtext-wcdb"
        />
      </Button>
      {mainComponent}
    </>
  );
};
