import React from 'react';
import styled from 'styled-components';
import { Box, Divider } from '@material-ui/core';
import { Colors } from '../../constants';
import { TranslatedText } from '../Translation';
import { PencilIcon } from '../../assets/icons/PencilIcon';
import { ThemedTooltip } from '../Tooltip';
import { BodyText, Heading3 } from '../Typography';
import { Button } from '../Button';
import { getInvoiceSummary } from '@tamanu/shared/utils/invoice';
import { getDateDisplay } from '../DateDisplay';

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
  padding: 8px 16px;
  margin-left: auto;
  background: ${Colors.white};
`;

const DiscountedPrice = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100px;
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

export const InvoiceSummaryPanel = ({ invoice, editable, handleEditDiscount }) => {
  const {
    discountableItemsSubtotal,
    nonDiscountableItemsSubtotal,
    total,
    appliedToDiscountableSubtotal,
    discountTotal,
    patientTotal,
  } = getInvoiceSummary(invoice);

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
