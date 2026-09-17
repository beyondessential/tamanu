import React from 'react';
import { describe, it, expect } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { INVOICE_ITEMS_DISCOUNT_TYPES } from '@tamanu/constants';
import { PriceCell } from '../../../app/features/Invoice/InvoiceForm/InvoiceItemCells/PriceCell';
import { renderElementWithTranslatedText } from '../../helpers/render';

const buildAdjustedItem = ({ reason, amount }) => ({
  id: 'item-1',
  quantity: 1,
  priceFinal: 100,
  productId: 'product-1',
  product: { name: 'Consultation' },
  discount: {
    type: INVOICE_ITEMS_DISCOUNT_TYPES.PERCENTAGE,
    amount,
    reason,
  },
});

const renderPriceCell = item =>
  renderElementWithTranslatedText(
    <table>
      <tbody>
        <tr>
          <PriceCell index={0} item={item} hidePriceInput isSaved isEditing={false} />
        </tr>
      </tbody>
    </table>,
  );

describe('PriceCell adjustment reason tooltip', () => {
  it('reveals the discount reason on hover', async () => {
    renderPriceCell(buildAdjustedItem({ reason: 'Staff discount', amount: 0.2 }));

    // Hovering anywhere in the adjustment block should surface the reason. The event is
    // fired on a descendant to prove it reaches the element holding the hover handlers.
    fireEvent.mouseOver(screen.getByText('Item discount'));

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip.textContent).toContain('Staff discount');
  });

  it('reveals the markup reason on hover', async () => {
    renderPriceCell(buildAdjustedItem({ reason: 'After hours surcharge', amount: -0.2 }));

    fireEvent.mouseOver(screen.getByText('Item markup'));

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip.textContent).toContain('After hours surcharge');
  });

  it('shows no tooltip when the adjustment has no recorded reason', async () => {
    renderPriceCell(buildAdjustedItem({ reason: undefined, amount: 0.2 }));

    fireEvent.mouseOver(screen.getByText('Item discount'));

    await expect(screen.findByRole('tooltip')).rejects.toThrow();
  });
});
