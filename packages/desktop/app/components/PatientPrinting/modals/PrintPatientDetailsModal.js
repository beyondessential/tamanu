import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';

import { Modal } from '../../Modal';
import { Button } from '../../Button';
import { Colors } from '../../../constants';
import { useApi, isErrorUnknownAllow404s } from '../../../api';
import { Form, Field, NumberField, SelectField } from '../../Field';
import { FormGrid } from '../../FormGrid';

import { PatientIDCardPage } from './PatientIDCardPage';

const PRINT_OPTIONS = {
  idcard: {
    label: 'ID Card',
    component: PatientIDCardPage,
  },
};

const PrintOptionButton = styled(Button)`
  background: ${Colors.white};
  border: 2px solid ${Colors.primary};
  border-radius: 5px;
  color: ${Colors.primary};

  justify-content: center;
  text-align: -webkit-center;

  height: 63px;
  width: 100%;
  margin: 14px 0px;
`;

const COLOR_OPTIONS = [
  {
    label: 'True black',
    value: '#000000',
  },
  {
    label: 'Mixed black',
    value: '#0A0B0B',
  },
  {
    label: 'Default',
    value: '#444444',
  },
];

const PRINT_SELECTION_OPTIONS = [
  {
    label: 'Default (photo + text)',
    value: 'default',
  },
  {
    label: 'Photo only',
    value: 'photo',
  },
  {
    label: 'Text only',
    value: 'text',
  },
];

const PrintOption = ({ setCurrentlyPrinting }) => (
  <Form
    initialValues={{
      leftPadding: 0,
      shrinkBy: 0,
      colorOption: COLOR_OPTIONS[2].value,
      printSelection: PRINT_SELECTION_OPTIONS[0].value,
    }}
    validationSchema={yup.object().shape({
      leftPadding: yup
        .number()
        .min(0)
        .max(10)
        .required(),
      shrinkBy: yup
        .number()
        .min(0)
        .max(99)
        .required(),
    })}
    onSubmit={async values => {
      setCurrentlyPrinting('idcard', values);
    }}
    render={() => (
      <>
        <FormGrid columns={2}>
          <Field
            name="leftPadding"
            label="Left padding"
            component={NumberField}
            min={0}
            max={10}
            required
          />
          <Field
            name="shrinkBy"
            label="Shrink by (%)"
            component={NumberField}
            min={0}
            max={99}
            required
          />
          <Field
            name="colorOption"
            label="Type of black"
            component={SelectField}
            options={COLOR_OPTIONS}
            required
          />
          <Field
            name="printSelection"
            label="Print selection"
            component={SelectField}
            options={PRINT_SELECTION_OPTIONS}
            required
          />
        </FormGrid>
        <PrintOptionButton color="default" type="submit">
          PRINT ID CARD
        </PrintOptionButton>
      </>
    )}
  />
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
  const [pageProps, setPageProps] = useState({});
  const api = useApi();

  const setCurrentlyPrinting = useCallback(
    async (type, pagePropsData) => {
      setPrintType(type);
      setImageData('');
      if (type === 'idcard') {
        setPageProps(pagePropsData);
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
        <Modal title="Select item to print" open={isModalOpen} onClose={closeModal}>
          <PrintOption setCurrentlyPrinting={setCurrentlyPrinting} />
        </Modal>
      );
    }
    const Component = PRINT_OPTIONS[printType].component;
    const props = {
      patient,
    };

    if (printType === 'idcard') {
      // printing ID card -- wait until profile pic download completes
      // (triggered in the callback above)
      if (!imageData) {
        return (
          <Modal title="Working" open>
            <div>Preparing ID card...</div>
          </Modal>
        );
      }
      props.imageData = imageData;
    }
    return <Component {...props} pageProps={pageProps} />;
  })();

  return (
    <>
      <Button size="small" onClick={openModal}>
        Print ID forms
      </Button>
      {mainComponent}
    </>
  );
};
