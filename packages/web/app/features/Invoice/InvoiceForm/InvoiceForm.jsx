import React, { useState } from 'react';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import { Plus } from 'lucide-react';
import { Box, CircularProgress, Divider, Button as MuiButton } from '@material-ui/core';
import PrintIcon from '@material-ui/icons/Print';
import {
  Form,
  Button,
  TranslatedText,
  FormSubmitButton,
  FormCancelButton,
} from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { FieldArray } from 'formik';
import { isInvoiceEditable } from '@tamanu/shared/utils/invoice';
import { INVOICE_STATUSES } from '@tamanu/constants';
import { InvoiceItemRow } from './InvoiceItem';
import { InvoiceItemHeader } from './InvoiceItemHeader';
import { useUpdateInvoice } from '../../../api/mutations/useInvoiceMutation';
import { InvoiceRecordModal } from '../../../components/PatientPrinting/modals/InvoiceRecordModal';
import { useAuth } from '../../../contexts/Auth';
import { invoiceFormSchema } from './invoiceFormSchema';

const AddButton = styled(MuiButton)`
  font-size: 14px;
  text-transform: none;
  color: ${Colors.primary};
  position: relative;
  top: -2px;

  .MuiButton-startIcon {
    width: 20px;
    position: relative;
    top: -2px;
    margin-right: 2px;
  }
`;

const SubmitButton = styled(FormSubmitButton)`
  &.Mui-disabled {
    color: ${Colors.white};
    background-color: ${Colors.primary};
    opacity: 0.3;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 10px 0;
`;

const PrintButton = styled(Button)`
  position: absolute;
  right: 70px;
`;

const getDefaultRow = () => ({ id: uuidv4(), quantity: 1 });

export const InvoiceForm = ({ invoice, isPatientView }) => {
  const { ability } = useAuth();
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const canWriteInvoice = ability.can('write', 'Invoice');
  const canDeleteInvoice = ability.can('delete', 'Invoice');
  const editable = isInvoiceEditable(invoice) && canWriteInvoice;
  const cancelable =
    invoice.status === INVOICE_STATUSES.IN_PROGRESS && isPatientView && canWriteInvoice;
  const finalisable =
    invoice.status === INVOICE_STATUSES.IN_PROGRESS &&
    !!invoice.encounter?.endDate &&
    isPatientView &&
    canWriteInvoice;
  const deletable =
    invoice.status !== INVOICE_STATUSES.FINALISED && isPatientView && canDeleteInvoice;

  const { mutate: updateInvoice, isLoading: isUpdatingInvoice } = useUpdateInvoice(invoice);

  const handleSubmit = async data => {
    const invoiceItems = data.invoiceItems.filter(item => !!item.productId);
    updateInvoice({
      ...invoice,
      items: invoiceItems,
      insurers: data.insurers.map(insurer => ({
        ...insurer,
        percentage: insurer.percentage / 100,
      })),
    });
  };

  const handleShowErrorDialog = errors => {
    return Object.keys(errors).length === 1 && errors['totalInsurerPercentage'];
  };

  return (
    <>
      <Box>
        {isPatientView && !editable && (
          <PrintButton
            onClick={() => setPrintModalOpen(true)}
            color="primary"
            variant="outlined"
            startIcon={<PrintIcon data-testid="printicon-700j" />}
            size="small"
            data-testid="printbutton-7m03"
          >
            <TranslatedText
              stringId="general.action.print"
              fallback="Print"
              data-testid="translatedtext-oqyn"
            />
          </PrintButton>
        )}
        {printModalOpen && (
          <InvoiceRecordModal
            open
            onClose={() => setPrintModalOpen(false)}
            invoice={invoice}
            data-testid="invoicerecordmodal-ep8b"
          />
        )}
      </Box>
      {(finalisable || cancelable || deletable) && (
        <>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            paddingX="36px"
            marginBottom="-16px"
            data-testid="box-bf9z"
          ></Box>
          {finalisable && (
            <Divider
              style={{
                margin: '30px 36px -15px 36px',
              }}
              data-testid="divider-x5gi"
            />
          )}
        </>
      )}
      <Form
        suppressErrorDialogCondition={errors => !handleShowErrorDialog(errors)}
        onSubmit={handleSubmit}
        enableReinitialize
        initialValues={{
          invoiceItems: invoice.items?.length ? invoice.items : [editable ? getDefaultRow() : {}],
          insurers: invoice.insurers?.length
            ? invoice.insurers.map(insurer => ({
                ...insurer,
                percentage: insurer.percentage * 100,
              }))
            : [],
        }}
        validationSchema={invoiceFormSchema}
        render={({ submitForm, values, resetForm }) => (
          <FieldArray name="invoiceItems">
            {formArrayMethods => {
              return (
                <>
                  <InvoiceItemHeader />
                  <Box>
                    {values.invoiceItems?.map((item, index) => {
                      return (
                        <InvoiceItemRow
                          key={item.id}
                          index={index}
                          item={item}
                          isDeleteDisabled={values.invoiceItems?.length === 1}
                          showActionMenu={item.productId || values.invoiceItems.length > 1}
                          formArrayMethods={formArrayMethods}
                          editable={editable && canWriteInvoice}
                          data-testid={`invoiceitemrow-ri5o-${index}`}
                        />
                      );
                    })}
                  </Box>
                  <ButtonRow>
                    {editable && canWriteInvoice && (
                      <AddButton
                        variant="text"
                        onClick={() => formArrayMethods.push(getDefaultRow())}
                        startIcon={<Plus />}
                      >
                        <TranslatedText
                          stringId="invoice.form.action.addItem"
                          fallback="Add item"
                          data-testid="translatedtext-9vs0"
                        />
                      </AddButton>
                    )}
                    <FormCancelButton
                      style={{ marginLeft: 'auto' }}
                      onClick={() => {
                        resetForm();
                      }}
                    >
                      Cancel
                    </FormCancelButton>
                    <SubmitButton onSubmit={submitForm} disabled={isUpdatingInvoice}>
                      {!isUpdatingInvoice ? (
                        editable && canWriteInvoice ? (
                          <TranslatedText
                            stringId="invoice.form.action.save"
                            fallback="Save item/s"
                            data-testid="translatedtext-26ji"
                          />
                        ) : (
                          <TranslatedText
                            stringId="general.action.close"
                            fallback="Close"
                            data-testid="translatedtext-qol5"
                          />
                        )
                      ) : (
                        <CircularProgress
                          size={14}
                          color={Colors.white}
                          data-testid="circularprogress-b1j8"
                        />
                      )}
                    </SubmitButton>
                  </ButtonRow>
                </>
              );
            }}
          </FieldArray>
        )}
      />
    </>
  );
};
