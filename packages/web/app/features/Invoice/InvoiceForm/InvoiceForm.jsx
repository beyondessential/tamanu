import React, { useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import { Plus } from 'lucide-react';
import { FieldArray } from 'formik';
import { v4 as uuidv4 } from 'uuid';

import {
  Form,
  TranslatedText,
  FormSubmitButton,
  FormCancelButton,
  useDateTime,
  TextButton,
} from '@tamanu/ui-components';
import { INVOICE_STATUSES } from '@tamanu/constants';
import {
  isInvoiceEditable,
  isInvoiceSectioned,
  resolveEncounterPeriod,
  resolveSectionPeriods,
} from '@tamanu/utils/invoice';
import { Colors } from '../../../constants/styles';
import { CELL_WIDTHS, CELL_WIDTHS_EDITABLE, INVOICE_FORM_TYPE } from '../constants';
import { InvoiceItemRow } from './InvoiceItem';
import { InvoiceItemHeader } from './InvoiceItemHeader';
import {
  useUpdateInvoice,
  useUpdateInvoiceItemApproval,
} from '../../../api/mutations/useInvoiceMutation';
import { useAuth } from '../../../contexts/Auth';
import { buildInvoiceFormSchema } from './invoiceFormSchema';
import { InvoiceSectionHeader } from './InvoiceSectionHeader';
import { INVOICE_MODAL_TYPES } from '../../../constants';
import { isZeroedBedFeeItem } from '../../../utils/invoice';

// The table stays border-collapsed so the row-separator borders render; a border-radius on a
// collapsed table is ignored, so the rounded outer border lives on TableWrapper, which clips the
// square table corners with overflow: hidden. The edit-mode product dropdown portals out, so it
// isn't affected by the clipping.
const TableWrapper = styled.div`
  ${p =>
    p.$bordered &&
    css`
      border: 1px solid ${Colors.outline};
      border-radius: 3px;
      overflow: hidden;
    `}
`;

const Table = styled.table`
  background-color: ${p => p.theme.palette.background.paper};
  border-radius: ${p => p.theme.shape.borderRadius}px;
  inline-size: 100%;
  font-size: 14px;
  th,
  td {
    padding-block: 12px;
    padding-inline: 10px;
  }
  th {
    vertical-align: bottom;
  }
  td {
    vertical-align: top;
  }
`;

const AddButton = styled(TextButton).attrs({ startIcon: <Plus /> })`
  font-size: inherit;
  font-weight: 500;
  color: ${Colors.primary};
  .MuiButton-startIcon {
    font-size: inherit;
    margin-inline-end: 4px;
    width: 18px;
  }
  &:hover {
    color: ${Colors.primary};
    text-decoration: underline;
  }
`;

const SubmitButton = styled(FormSubmitButton)`
  &.Mui-disabled {
    color: ${Colors.white};
    background-color: ${Colors.primary};
    opacity: 0.3;
  }
`;

const EditModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin: 40px -40px 0;
  padding: 30px 40px 0;
  border-top: 1px solid ${Colors.outline};
`;

const FormFooter = styled(({ children, ...props }) => (
  <tfoot {...props}>
    <tr>
      <td colSpan={9}>{children}</td>
    </tr>
  </tfoot>
))`
  border-end-end-radius: inherit;
  border-end-start-radius: inherit;
`;

// Rows grouped into the sections the invoice is divided into, each row keeping its index in the
// formik array so field names and the save payload are unchanged. Items whose section the facility
// does not hold fall into the trailing unlabelled group, which carries no header.
const groupRowsBySection = (rows, sections) => {
  const indexedRows = rows.map((item, index) => ({ item, index }));
  const sectionIds = new Set(sections.map(section => section.invoiceSectionId));
  return [
    ...sections.map(section => ({
      section,
      rows: indexedRows.filter(({ item }) => item.invoiceSectionId === section.invoiceSectionId),
    })),
    {
      section: null,
      rows: indexedRows.filter(({ item }) => !sectionIds.has(item.invoiceSectionId)),
    },
  ];
};

// A new line in a section whose period has ended starts with no date, because today is outside it.
const getDefaultRow = (getCurrentDate, orderedByUserId, section, period) => ({
  /**
   * `crypto.randomUUID` requires a secure context, but Tamanu is sometimes accessed via a literal
   * IP address over a LAN (e.g. Iti) using HTTP. (HTTPS not yet supported in this scenario.) Hence
   * using `uuid`, which prefers `crypto.randomUUID` but falls back to `crypto.getRandomValues` as
   * needed. Saves users from getting crash with “crypto.randomUUID is not a function”.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID
   */
  id: uuidv4(),
  quantity: 1,
  // A section whose period has ended starts empty; the current one starts at today. This is the
  // resolved period the row will be validated against, so a new row never opens already invalid.
  orderDate: period?.endDate && period.endDate < getCurrentDate() ? '' : getCurrentDate(),
  orderedByUserId,
  invoiceSectionId: section?.invoiceSectionId ?? null,
});

export const InvoiceForm = ({
  invoice,
  invoiceFormType,
  onClose,
  setInvoiceModalType,
  onAddItemsForSection,
  section,
}) => {
  const { ability } = useAuth();
  const { getCurrentDate, formatShort } = useDateTime();
  const isEditForm = invoiceFormType === INVOICE_FORM_TYPE.EDIT_ITEMS;
  const isReadOnlyForm = invoiceFormType === INVOICE_FORM_TYPE.READ_ONLY;
  const isAddForm = invoiceFormType === INVOICE_FORM_TYPE.ADD_ITEMS;

  const cellWidths = isReadOnlyForm ? CELL_WIDTHS : CELL_WIDTHS_EDITABLE;

  // Null when the invoice has nothing to tell apart, so the table renders exactly as it did
  // before sections existed. The rule itself lives beside the builder, so the view does not carry
  // its own idea of what counts as split.
  const sections = isInvoiceSectioned(invoice.sections, invoice.items) ? invoice.sections : null;
  const isEditing = isAddForm || isEditForm;
  const columnCount = isEditing ? 7 : 9;
  // Both come from the server already resolved to the facility's own calendar dates, so every
  // bound in the form has one source and cannot drift from the headers beside it.
  const sectionPeriods = resolveSectionPeriods(
    invoice.sections,
    invoice.encounterPeriod,
    getCurrentDate(),
  );
  const encounterPeriod = resolveEncounterPeriod(invoice.encounterPeriod, getCurrentDate());

  // The table renders flat when there is nothing to tell apart, but a row added there still
  // belongs to the one section the encounter has, so it carries its id and its date limits.
  const soleSection = invoice.sections?.length === 1 ? invoice.sections[0] : null;
  const addTargetSection = section ?? soleSection;
  const periodFor = forSection =>
    (forSection ? sectionPeriods[forSection.invoiceSectionId] : null) ?? encounterPeriod;

  // Formik re-renders on every keystroke, so the schema is built from the resolved bounds rather
  // than rebuilt each time.
  const validationSchema = useMemo(
    () => buildInvoiceFormSchema(sectionPeriods, encounterPeriod, formatShort),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(sectionPeriods), JSON.stringify(encounterPeriod), formatShort],
  );

  // inProgressItems is used to re-populate the form with in progress items after the form is updated
  const [inProgressItems, setInProgressItems] = useState(
    isAddForm
      ? [
          getDefaultRow(
            getCurrentDate,
            invoice.encounter?.examinerId,
            addTargetSection,
            periodFor(addTargetSection),
          ),
        ]
      : [],
  );
  const canWriteInvoice = ability.can('write', 'Invoice');
  const editable = isInvoiceEditable(invoice) && canWriteInvoice;
  const isFinalised = invoice.status === INVOICE_STATUSES.FINALISED;
  const isCancelled = invoice.status === INVOICE_STATUSES.CANCELLED;
  const { mutate: updateInvoice, isLoading: isUpdatingInvoice } = useUpdateInvoice(invoice);
  const { mutate: updateItemApproval } = useUpdateInvoiceItemApproval(invoice);

  // Main submit action for the invoice
  const handleSubmit = async data => {
    const newItems = data.invoiceItems.filter(item => !!item.productId);
    // In add modal mode, merge new items with existing ones rather than replacing
    const invoiceItems = isAddForm ? [...(invoice.items ?? []), ...newItems] : newItems;

    updateInvoice(
      {
        ...invoice,
        items: invoiceItems,
        insurers: data.insurers.map(insurer => ({
          ...insurer,
          percentage: insurer.percentage / 100,
        })),
      },
      {
        onSuccess: () => {
          setInProgressItems([]);
          onClose?.();
        },
      },
    );
  };

  // Used for invoice item actions
  const handleUpdateItem = async data => {
    const itemsToSave = data.invoiceItems.filter(item => !!item.product?.id);
    const inProgressItems = data.invoiceItems.filter(item => !item.product?.id);

    setInProgressItems(inProgressItems);

    updateInvoice(
      {
        ...invoice,
        items: itemsToSave,
      },
      {
        onSuccess: () => {
          onClose?.();
        },
      },
    );
  };

  const handleShowErrorDialog = errors => {
    return Object.keys(errors).length === 1 && errors['totalInsurerPercentage'];
  };

  return (
    <Form
      suppressErrorDialogCondition={errors => !handleShowErrorDialog(errors)}
      onSubmit={handleSubmit}
      enableReinitialize
      initialValues={{
        // Tag already-saved lines so validation keeps their product/ordered-by required: clearing a
        // field on an existing line must block save (see invoiceFormSchema) rather than silently drop
        // the line. Blank add-rows stay untagged so they remain discardable on save.
        invoiceItems: isAddForm
          ? inProgressItems
          : [
              ...(invoice.items ?? []).map(item => ({
                ...item,
                isExistingItem: true,
                originalOrderDate: item.orderDate,
              })),
              ...inProgressItems,
            ],
        insurers: invoice.insurers?.length
          ? invoice.insurers.map(insurer => ({
              ...insurer,
              percentage: insurer.percentage * 100,
            }))
          : [],
      }}
      validationSchema={validationSchema}
      render={({ submitForm, values }) => (
        <>
          <TableWrapper $bordered={isEditForm || isAddForm}>
            <Table>
              <FieldArray name="invoiceItems">
                {formArrayMethods => {
                  const renderRow = ({ item, index }) =>
                    // Hide bed-fee lines zeroed by a ward move; kept in the array so their index
                    // and the save payload are unchanged.
                    isZeroedBedFeeItem(item) ? null : (
                      <InvoiceItemRow
                        cellWidths={cellWidths}
                        encounterId={invoice.encounterId}
                        formArrayMethods={formArrayMethods}
                        index={index}
                        isCancelled={isCancelled}
                        isEditing={isEditing}
                        isFinalised={isFinalised}
                        item={item}
                        key={item.id}
                        onUpdateApproval={updateItemApproval}
                        onUpdateInvoice={handleUpdateItem}
                        priceListId={invoice.priceList?.id}
                        sectionPeriod={(sectionPeriods[item.invoiceSectionId] ?? encounterPeriod)}
                      />
                    );

                  const handleAdd = targetSection => {
                    if (isReadOnlyForm) {
                      if (onAddItemsForSection) {
                        onAddItemsForSection(targetSection);
                      } else {
                        setInvoiceModalType(INVOICE_MODAL_TYPES.ADD_ITEMS);
                      }
                      return;
                    }
                    const rowSection = targetSection ?? addTargetSection;
                    formArrayMethods.push(
                      getDefaultRow(
                        getCurrentDate,
                        invoice.encounter?.examinerId,
                        rowSection,
                        periodFor(rowSection),
                      ),
                    );
                  };

                  const addItemLabel = (
                    <TranslatedText stringId="invoice.form.action.addItem" fallback="Add item" />
                  );
                  const showAddItem = editable && (isReadOnlyForm || isAddForm);

                  return (
                    <>
                      <InvoiceItemHeader cellWidths={cellWidths} isEditing={isEditing} />
                      {sections && !isAddForm ? (
                        groupRowsBySection(values.invoiceItems ?? [], sections).map(group => {
                          // A configured section always shows, so a period with no items still
                          // offers its header and its own Add item. The unlabelled group has
                          // nothing to show when it is empty.
                          if (!group.section && group.rows.length === 0) return null;
                          return (
                            <tbody key={group.section?.invoiceSectionId ?? 'unlabelled'}>
                              {group.section && (
                                <InvoiceSectionHeader
                                  section={group.section}
                                  columnCount={columnCount}
                                />
                              )}
                              {group.rows.map(renderRow)}
                              {showAddItem && group.section && (
                                <tr>
                                  <td colSpan={columnCount}>
                                    <AddButton onClick={() => handleAdd(group.section)}>
                                      {addItemLabel}
                                    </AddButton>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          );
                        })
                      ) : (
                        <>
                          <tbody>
                            {(values.invoiceItems ?? []).map((item, index) =>
                              renderRow({ item, index }),
                            )}
                          </tbody>
                          {showAddItem && (
                            <FormFooter>
                              <AddButton onClick={() => handleAdd(addTargetSection)}>
                                {addItemLabel}
                              </AddButton>
                            </FormFooter>
                          )}
                        </>
                      )}
                    </>
                  );
                }}
              </FieldArray>
            </Table>
          </TableWrapper>
          {editable && (isEditForm || isAddForm) && (
            <EditModalFooter>
              <FormCancelButton
                style={{ marginRight: 8 }}
                onClick={() => {
                  setInProgressItems([]);
                  onClose?.();
                }}
              >
                <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
              </FormCancelButton>
              <SubmitButton onSubmit={submitForm} disabled={isUpdatingInvoice}>
                {isAddForm ? (
                  <TranslatedText stringId="invoice.form.action.save" fallback="Save" />
                ) : (
                  <TranslatedText
                    stringId="invoice.form.action.saveChanges"
                    fallback="Save changes"
                  />
                )}
              </SubmitButton>
            </EditModalFooter>
          )}
        </>
      )}
    />
  );
};
