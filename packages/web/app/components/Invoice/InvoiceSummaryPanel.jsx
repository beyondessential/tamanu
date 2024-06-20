import React from 'react';
import styled from 'styled-components';
import { Box, Divider } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { SETTING_KEYS } from '@tamanu/constants';
import { FieldArray, useFormikContext } from 'formik';
import { v4 as uuidv4 } from 'uuid';
import { Colors } from '../../constants';
import { TranslatedText } from '../Translation';
import { PencilIcon } from '../../assets/icons/PencilIcon';
import { ThemedTooltip } from '../Tooltip';
import { BodyText, Heading3 } from '../Typography';
import { Button } from '../Button';
import { getInsurerPaymentsDisplay, getInvoiceSummary } from '@tamanu/shared/utils/invoice';
import { getDateDisplay } from '../DateDisplay';
import { useSettings } from '../../contexts/Settings';
import { AutocompleteField, Field, NumberField } from '../Field';
import { useSuggester } from '../../api';

const CardItem = styled(Box)`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  justify-content: space-between;
  align-items: flex-start;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 382px;
  border: 1px solid ${Colors.outline};
  border-radius: 5px;
  padding: 16px 20px;
  margin-left: auto;
  background: ${Colors.white};
`;

const DiscountedPrice = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100px;
  flex-shrink: 0;
`;

const IconButton = styled.span`
  cursor: pointer;
  position: relative;
  top: 1px;
`;

const DescriptionText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AddInsurerButton = styled(Button)`
  padding: 4px 8px !important;
  margin-left: -8px;
  &:hover {
    background: unset;
  }
`;

const RemoveInsurerButton = styled(IconButton)`
  position: absolute;
  right: -17px;
  top: 12.5px;
  display: flex;
  .MuiSvgIcon-root {
    font-size: 16px;
  }
`;

const StyledNumberField = styled(NumberField)`
  input {
    padding: 13px 10px !important;
    font-size: 11px !important;
  }
`;

const InsurersEditable = ({ insurerPaymentsDisplay }) => {
  const formikContext = useFormikContext();
  const insurers = formikContext?.values?.insurers || [];

  const { getSetting } = useSettings();
  const defaultContributionInsurer = getSetting(SETTING_KEYS.INSURER_DEFAUlT_CONTRIBUTION);

  const insurerSuggester = useSuggester('insurer');

  const preventInvalid = event => {
    if (!event.target.validity.valid) {
      event.target.value = '';
    }
  };

  return (
    <FieldArray name="insurers">
      {formArrayMethods => {
        return (
          <CardItem flexDirection="column">
            <TranslatedText stringId="invoice.summary.insurer.label" fallback="Insurer" />
            {insurers?.map((insurer, index) => (
              <Box key={insurer?.id} display="flex" justifyContent="space-between" width="100%" position="relative">
                <Box display="flex" style={{ gap: '8px' }}>
                  <Field
                    name={`insurers.${index}.insurerId`}
                    required
                    component={AutocompleteField}
                    suggester={insurerSuggester}
                    size="small"
                  />
                  <Field
                    name={`insurers.${index}.percentage`}
                    component={StyledNumberField}
                    min={1}
                    max={100}
                    onInput={preventInvalid}
                    required
                  />
                  <Box marginTop="11px">%</Box>
                </Box>
                <Box marginTop="11px" display="flex" justifyContent="flex-end">
                  {insurerPaymentsDisplay[index] ?? '-'}
                  <RemoveInsurerButton onClick={() => formArrayMethods.remove(index)}>
                    <CloseIcon />
                  </RemoveInsurerButton>
                </Box>
              </Box>
            ))}
            <AddInsurerButton
              variant="text"
              disableRipple
              onClick={() => {
                formArrayMethods.push({
                  id: uuidv4(),
                  percentage:
                    !insurers?.length && defaultContributionInsurer
                      ? defaultContributionInsurer * 100
                      : undefined,
                });
              }}
            >
              {'+ '}
              <TranslatedText
                stringId="invoice.summary.addInsurer"
                fallback="Add another insurer"
              />
            </AddInsurerButton>
          </CardItem>
        );
      }}
    </FieldArray>
  );
};

const InsurersView = ({ insurers, insurerPaymentsDisplay }) => {
  return (
    <CardItem flexDirection="column">
      <Box fontWeight={500}>
        <TranslatedText stringId="invoice.summary.insurer.label" fallback="Insurer" />
      </Box>
      {insurers?.map((insurer, index) => (
        <Box key={insurer.id} display="flex" justifyContent="space-between" width="100%">
          {insurer.insurer?.name}
          <DiscountedPrice>
            <span>{Math.round(insurer.percentage * 100)}%</span>
            <BodyText color={Colors.darkestText}>-{insurerPaymentsDisplay[index] ?? '-'}</BodyText>
          </DiscountedPrice>
        </Box>
      ))}
    </CardItem>
  );
};

export const InvoiceSummaryPanel = ({ invoice, editable, handleEditDiscount }) => {
  const formikContext = useFormikContext();
  const insurers =
    formikContext?.values?.insurers?.map(insurer => ({
      ...insurer,
      percentage: insurer.percentage / 100,
    })) ||
    invoice?.insurers ||
    [];

  const {
    discountableItemsSubtotal,
    nonDiscountableItemsSubtotal,
    total,
    appliedToDiscountableSubtotal,
    discountTotal,
    patientSubtotal,
    patientTotal,
  } = getInvoiceSummary({ ...invoice, insurers });

  const insurerPaymentsDisplay = getInsurerPaymentsDisplay(insurers, total);

  return (
    <Container>
      <CardItem>
        <TranslatedText
          stringId="invoice.summary.subtotal.discountable"
          fallback="Discountable items subtotal"
        />
        <span>{discountableItemsSubtotal ?? '-'}</span>
      </CardItem>
      <CardItem>
        <TranslatedText
          stringId="invoice.summary.subtotal.nondiscountable"
          fallback="Non-discountable items subtotal"
        />
        <span>{nonDiscountableItemsSubtotal ?? '-'}</span>
      </CardItem>
      <Divider />
      <CardItem sx={{ fontWeight: 500 }}>
        <TranslatedText stringId="invoice.summary.total.label" fallback="Total" />
        <span>{total ?? '-'}</span>
      </CardItem>
      <Divider />
      {editable && (
        <>
          <InsurersEditable insurerPaymentsDisplay={insurerPaymentsDisplay} />
          <Divider />
        </>
      )}
      {!editable && !!insurers?.length && (
        <>
          <InsurersView insurers={insurers} insurerPaymentsDisplay={insurerPaymentsDisplay} />
          <Divider />
        </>
      )}
      {(!!insurers?.length || editable) && (
        <>
          <CardItem sx={{ fontWeight: 500 }}>
            <TranslatedText
              stringId="invoice.summary.patientSubtotal.label"
              fallback="Patient subtotal"
            />
            <span>{patientSubtotal ?? '-'}</span>
          </CardItem>
          <Divider />
        </>
      )}
      <CardItem sx={{ marginBottom: '-6px', fontWeight: 500 }}>
        <TranslatedText stringId="invoice.summary.discount.label" fallback="Discount" />
        {editable && !invoice.discount && (
          <Button onClick={handleEditDiscount}>
            <TranslatedText stringId="invoice.summary.action.addDiscount" fallback="Add discount" />
          </Button>
        )}
        {!!invoice.discount && (
          <DiscountedPrice>
            <span>{invoice.discount.percentage * 100}%</span>
            <BodyText sx={{ fontWeight: 400 }} color={Colors.darkestText}>
              -{discountTotal}
            </BodyText>
          </DiscountedPrice>
        )}
      </CardItem>
      {!!invoice.discount && (
        <CardItem
          sx={{
            marginBottom: '-6px',
            color: Colors.midText,
            '&&': { justifyContent: 'flex-start' },
          }}
        >
          <DescriptionText>
            <ThemedTooltip
              title={
                <Box textAlign="center" whiteSpace="pre">
                  <span>{invoice.discount?.reason}</span>
                  {invoice.discount?.reason && '\n'}
                  <span>
                    {`${invoice.discount?.appliedByUser?.displayName}, ${getDateDisplay(
                      invoice.discount?.appliedTime,
                    )}`}
                  </span>
                </Box>
              }
            >
              <span>
                {invoice.discount?.isManual ? (
                  <TranslatedText
                    stringId="invoice.summary.discountManual"
                    fallback="Manual discount"
                  />
                ) : (
                  <TranslatedText
                    stringId="invoice.summary.discountAssessment"
                    fallback="Patient discount applied"
                  />
                )}
              </span>
            </ThemedTooltip>
          </DescriptionText>
          {editable && (
            <IconButton onClick={handleEditDiscount}>
              <PencilIcon />
            </IconButton>
          )}
        </CardItem>
      )}
      {!!invoice.discount && (
        <CardItem sx={{ marginBottom: '-6px', color: Colors.midText }}>
          <TranslatedText
            stringId="invoice.summary.appliedDiscountable"
            fallback="Applied to discountable balance"
          />
          <DiscountedPrice>{appliedToDiscountableSubtotal ?? '-'}</DiscountedPrice>
        </CardItem>
      )}
      <Divider />
      <CardItem>
        <Heading3 sx={{ margin: 0 }}>
          <TranslatedText stringId="invoice.summary.patientTotal" fallback="Patient total" />
        </Heading3>
        <Heading3 sx={{ margin: 0 }}>{patientTotal ?? '-'}</Heading3>
      </CardItem>
    </Container>
  );
};
