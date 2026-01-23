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
import { Button, DefaultIconButton } from '../Button';
import {
  getInsurerDiscountAmountDisplayList,
  getInvoiceSummaryDisplay,
} from '@tamanu/shared/utils/invoice';
import { DateDisplay } from '@tamanu/ui-components';
import { useSettings } from '../../contexts/Settings';
import { AutocompleteField, Field, NumberField } from '../Field';
import { useSuggester } from '../../api';
import { NoteModalActionBlocker } from '../NoteModalActionBlocker';

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
  width: 450px;
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

const IconButton = styled(DefaultIconButton)`
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

const InsurersEditable = ({ insurerDiscountAmountDisplayList }) => {
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
    <FieldArray name="insurers" data-testid="fieldarray-f3fl">
      {formArrayMethods => {
        return (
          <CardItem flexDirection="column" data-testid="carditem-p9rg">
            {!!insurers.length && (
              <TranslatedText
                stringId="invoice.summary.insurer.label"
                fallback="Insurer"
                data-testid="translatedtext-7mzp"
              />
            )}
            {insurers?.map((insurer, index) => (
              <Box
                key={insurer?.id}
                display="flex"
                justifyContent="space-between"
                width="100%"
                position="relative"
                data-testid="box-70z7"
              >
                <Box display="flex" style={{ gap: '8px', flex: 1 }}>
                  <Box style={{ flex: 1 }}>
                    <NoteModalActionBlocker>
                      <Field
                        name={`insurers.${index}.insurerId`}
                        required
                        component={AutocompleteField}
                        suggester={insurerSuggester}
                        style={{ width: '100%' }}
                        data-testid={`field-6jf7-${index}`}
                      />
                    </NoteModalActionBlocker>
                  </Box>
                  <NoteModalActionBlocker>
                    <Field
                      name={`insurers.${index}.percentage`}
                      component={NumberField}
                      min={1}
                      max={100}
                      onInput={preventInvalid}
                      required
                      style={{ width: '70px' }}
                      data-testid={`field-v5p9-${index}`}
                    />
                  </NoteModalActionBlocker>
                  <Box marginTop="11px" data-testid={`box-mtns-${index}`}>
                    %
                  </Box>
                </Box>
                <Box
                  marginTop="11px"
                  marginLeft="10px"
                  display="flex"
                  justifyContent="flex-end"
                  flexShrink={0}
                  style={{ width: '70px' }}
                  data-testid={`box-mrtu-${index}`}
                >
                  {insurerDiscountAmountDisplayList[index]
                    ? `-${insurerDiscountAmountDisplayList[index]}`
                    : ''}
                  <NoteModalActionBlocker>
                    <RemoveInsurerButton onClick={() => formArrayMethods.remove(index)}>
                      <CloseIcon />
                    </RemoveInsurerButton>
                  </NoteModalActionBlocker>
                </Box>
              </Box>
            ))}
            <NoteModalActionBlocker>
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
                {insurers.length ? (
                  <TranslatedText
                    stringId="invoice.summary.action.addAnotherInsurer"
                    fallback="Add another insurer"
                  />
                ) : (
                  <TranslatedText
                    stringId="invoice.summary.action.addInsurer"
                    fallback="Add insurer"
                  />
                )}
              </AddInsurerButton>
            </NoteModalActionBlocker>
          </CardItem>
        );
      }}
    </FieldArray>
  );
};

const InsurersView = ({ insurers, insurerDiscountAmountDisplayList }) => {
  return (
    <CardItem flexDirection="column" data-testid="carditem-3k9i">
      <Box fontWeight={500} data-testid="box-8ytp">
        <TranslatedText
          stringId="invoice.summary.insurer.label"
          fallback="Insurer"
          data-testid="translatedtext-26zz"
        />
      </Box>
      {insurers?.map((insurer, index) => (
        <Box
          key={insurer.id}
          display="flex"
          justifyContent="space-between"
          width="100%"
          data-testid={`insurer-row-${index}`}
        >
          {insurer.insurer?.name}
          <DiscountedPrice data-testid={`discounted-price-${index}`}>
            <span data-testid={`percentage-${index}`}>{insurer.percentage * 100}%</span>
            <BodyText color={Colors.darkestText} data-testid={`discount-amount-${index}`}>
              {insurerDiscountAmountDisplayList[index]
                ? `-${insurerDiscountAmountDisplayList[index]}`
                : ''}
            </BodyText>
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
      percentage: isNaN(parseFloat(insurer.percentage)) ? undefined : insurer.percentage / 100,
    })) ||
    invoice?.insurers ||
    [];

  const {
    discountableItemsSubtotal,
    nonDiscountableItemsSubtotal,
    itemsSubtotal,
    patientSubtotal,
    patientDiscountableSubtotal,
    discountTotal,
    patientTotal,
  } = getInvoiceSummaryDisplay({ ...invoice, insurers });

  const insurerDiscountAmountDisplayList = getInsurerDiscountAmountDisplayList(
    insurers,
    itemsSubtotal,
  );

  return (
    <Container data-testid="container-p5qj">
      <CardItem data-testid="carditem-z6k5">
        <TranslatedText
          stringId="invoice.summary.subtotal.discountable"
          fallback="Discountable items subtotal"
          data-testid="translatedtext-17ar"
        />
        <span>{discountableItemsSubtotal ?? '-'}</span>
      </CardItem>
      <CardItem data-testid="carditem-tiv6">
        <TranslatedText
          stringId="invoice.summary.subtotal.nondiscountable"
          fallback="Non-discountable items subtotal"
          data-testid="translatedtext-828s"
        />
        <span>{nonDiscountableItemsSubtotal ?? '-'}</span>
      </CardItem>
      <Divider data-testid="divider-mot1" />
      <CardItem sx={{ fontWeight: 500 }} data-testid="carditem-vvf4">
        <TranslatedText
          stringId="invoice.summary.total.label"
          fallback="Total"
          data-testid="translatedtext-qedx"
        />
        <span>{itemsSubtotal ?? '-'}</span>
      </CardItem>
      <Divider data-testid="divider-49jw" />
      {editable && (
        <>
          <InsurersEditable
            insurerDiscountAmountDisplayList={insurerDiscountAmountDisplayList}
            data-testid="insurerseditable-7r3g"
          />
          <Divider data-testid="divider-gic9" />
        </>
      )}
      {!editable && !!insurers?.length && (
        <>
          <InsurersView
            insurers={insurers}
            insurerDiscountAmountDisplayList={insurerDiscountAmountDisplayList}
            data-testid="insurersview-3y9v"
          />
          <Divider data-testid="divider-bfqi" />
        </>
      )}
      {(!!insurers?.length || editable) && (
        <>
          <CardItem sx={{ fontWeight: 500 }} data-testid="carditem-o3em">
            <TranslatedText
              stringId="invoice.summary.patientSubtotal.label"
              fallback="Patient subtotal"
              data-testid="translatedtext-ekgn"
            />
            <span>{patientSubtotal ?? '-'}</span>
          </CardItem>
          <Divider data-testid="divider-foeu" />
        </>
      )}
      <CardItem sx={{ marginBottom: '-6px', fontWeight: 500 }} data-testid="carditem-1ngh">
        <TranslatedText
          stringId="invoice.summary.discount.label"
          fallback="Discount"
          data-testid="translatedtext-5iru"
        />
        {editable && !invoice.discount && (
          <NoteModalActionBlocker>
            <Button onClick={handleEditDiscount}>
              <TranslatedText
                stringId="invoice.summary.action.addDiscount"
                fallback="Add discount"
              />
            </Button>
          </NoteModalActionBlocker>
        )}
        {!!invoice.discount && (
          <DiscountedPrice data-testid="discountedprice-nuxm">
            <span>{invoice.discount.percentage * 100}%</span>
            <BodyText
              sx={{ fontWeight: 400 }}
              color={Colors.darkestText}
              data-testid="bodytext-511e"
            >
              {typeof discountTotal === 'string' ? `-${discountTotal}` : '-'}
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
          data-testid="carditem-85pj"
        >
          <DescriptionText data-testid="descriptiontext-6ty7">
            <ThemedTooltip
              title={
                <Box textAlign="center" whiteSpace="pre" data-testid="box-598v">
                  <span>{invoice.discount?.reason}</span>
                  {invoice.discount?.reason && '\n'}
                  <span>
                    {invoice.discount?.appliedByUser?.displayName}, <DateDisplay date={invoice.discount?.appliedTime} />
                  </span>
                </Box>
              }
              data-testid="themedtooltip-oem6"
            >
              <span>
                {invoice.discount?.isManual ? (
                  <TranslatedText
                    stringId="invoice.summary.discountManual"
                    fallback="Manual discount"
                    data-testid="translatedtext-lou8"
                  />
                ) : (
                  <TranslatedText
                    stringId="invoice.summary.discountAssessment"
                    fallback="Patient discount applied"
                    data-testid="translatedtext-usmq"
                  />
                )}
              </span>
            </ThemedTooltip>
          </DescriptionText>
          {editable && (
            <NoteModalActionBlocker>
              <IconButton onClick={handleEditDiscount}>
                <PencilIcon />
              </IconButton>
            </NoteModalActionBlocker>
          )}
        </CardItem>
      )}
      {!!invoice.discount && (
        <CardItem sx={{ marginBottom: '-6px', color: Colors.midText }} data-testid="carditem-wljk">
          <TranslatedText
            stringId="invoice.summary.appliedDiscountable"
            fallback="Applied to discountable balance"
            data-testid="translatedtext-5kcz"
          />
          <DiscountedPrice data-testid="discountedprice-v3xh">
            {patientDiscountableSubtotal ?? '-'}
          </DiscountedPrice>
        </CardItem>
      )}
      <Divider data-testid="divider-8zwi" />
      <CardItem data-testid="carditem-h9rd">
        <Heading3 sx={{ margin: 0 }} data-testid="heading3-y938">
          <TranslatedText
            stringId="invoice.summary.patientTotal"
            fallback="Patient total"
            data-testid="translatedtext-nst0"
          />
        </Heading3>
        <Heading3 sx={{ margin: 0 }} data-testid="heading3-vj7u">
          {patientTotal ?? '-'}
        </Heading3>
      </CardItem>
    </Container>
  );
};
