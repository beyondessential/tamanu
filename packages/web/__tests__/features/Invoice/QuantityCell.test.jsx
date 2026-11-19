import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Formik, useFormikContext } from 'formik';
import { SettingsContext } from '@tamanu/ui-components';
import { QuantityCell } from '../../../app/features/Invoice/InvoiceForm/InvoiceItemCells/QuantityCell';
import { PriceCell } from '../../../app/features/Invoice/InvoiceForm/InvoiceItemCells/PriceCell';
import { renderElementWithTranslatedText } from '../../helpers/render';

// The dispensing unit lookup needs the API and auth contexts, and these lines have no unit
vi.mock('../../../app/api/queries/useDispensingUnit', () => ({
  default: () => ({ data: undefined }),
}));

// Both cells read the line from the form values, as they do in the invoice form, so the price
// recalculates on every keystroke in the quantity field
const InvoiceItemRow = () => {
  const { values } = useFormikContext();
  const item = values.invoiceItems[0];
  return (
    <table>
      <tbody>
        <tr>
          <QuantityCell index={0} item={item} isEditing />
          <PriceCell index={0} item={item} isEditing hidePriceInput />
        </tr>
      </tbody>
    </table>
  );
};

const renderInvoiceItemRow = () => {
  renderElementWithTranslatedText(
    <SettingsContext.Provider value={{ getSetting: () => undefined }}>
      <Formik
        initialValues={{
          invoiceItems: [
            {
              quantity: 1,
              productId: 'product-1',
              product: { name: 'Consultation', invoicePriceListItem: { price: 10 } },
            },
          ],
        }}
        initialStatus={{}}
        onSubmit={() => {}}
      >
        <InvoiceItemRow />
      </Formik>
    </SettingsContext.Provider>,
  );
  return {
    quantityInput: screen.getByRole('spinbutton'),
    getPriceText: () => screen.getByTestId('pricetext-is33').textContent,
  };
};

describe('QuantityCell', () => {
  it('accepts a quantity above 99', async () => {
    const user = userEvent.setup();
    const { quantityInput, getPriceText } = renderInvoiceItemRow();

    await user.clear(quantityInput);
    await user.type(quantityInput, '9999');

    expect(quantityInput.value).toBe('9999');
    expect(getPriceText()).toBe('99,990.00');
  });

  it('can be emptied while the price recalculates', async () => {
    const user = userEvent.setup();
    const { quantityInput, getPriceText } = renderInvoiceItemRow();

    await user.clear(quantityInput);

    expect(quantityInput.value).toBe('');
    expect(getPriceText()).toBe('0.00');
  });
});
