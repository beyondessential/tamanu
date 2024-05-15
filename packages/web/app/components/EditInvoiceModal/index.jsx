import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Divider, Grid, IconButton, Menu } from '@material-ui/core';
import { MoreVert } from '@material-ui/icons';
import { Modal } from '../Modal';
import { TranslatedEnum, TranslatedText } from '../Translation';
import { AutocompleteField, DateField, Field, Form } from '../Field';
import { useApi, useSuggester } from '../../api';
import { Colors } from '../../constants';
import { FormSubmitCancelRow } from '../ButtonRow';
import { DataFetchingTable } from '../Table';
import { DateDisplay } from '../DateDisplay';
import { INVOICE_LINE_TYPE_LABELS } from '@tamanu/constants';
import { Button } from '../Button';
import { DeleteItemModal } from './DeleteItemModal';

const PriceText = styled.span`
  margin-right: 16px;
`;

const StyledItemRow = styled(Grid)`
  font-size: 11px;
  padding-left: 10px;
  padding-right: 10px;
  padding-bottom: 4px;
  background: white;
  border-left: 1px solid ${Colors.outline};
  border-right: 1px solid ${Colors.outline};
  border-top: 1px solid ${Colors.outline};
  ${props => props.hasBorderBottom &&
    `border-bottom: 1px solid ${Colors.outline}; padding-bottom: 0px;`}
`;

const StyledItemHeader = styled(Grid)`
  padding: 14px;
  font-weight: 500;
  border-radius: 4px 4px 0 0;
  border: 1px solid ${Colors.outline};
`;

const KebabMenuItem = styled.div`
  width: 124px;
  font-weight: 400;
  font-size: 11px;
  line-height: 15px;
  padding-left: 8px;
  padding-right: 8px;
  cursor: pointer;
  border-radius: 4px;
  padding-bottom: 8px;
  :hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const StyledMenu = styled(Menu)`
  & .MuiList-padding {
    padding-bottom: 0;
  }
`;

const LinkText = styled.div`
  font-weight: 500;
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.primary};
  margin-top: 10px;
  margin-bottom: 10px;
  cursor: pointer;
`;

const StyledIconButton = styled(IconButton)`
  margin-bottom: 4px;
  margin-left: auto;
`;

const PriceCell = styled.div`
  margin-left: 10%;
  display: flex;
  align-items: center;
`;

const ItemCodeText = styled.div`
  margin-left: 5%;
`;

const SingleAddButton = styled(Button)`
  min-width: 56px;
`;

const BulkAddButton = styled(Button)`
  min-width: 74px;
`;

const FormContainer = styled.div`
  padding: 34px 40px;
`;

const StyledDataFetchingTable = styled(DataFetchingTable)`
  max-height: 400px;
`;

const PotentialLineItemsPane = styled.div`
  max-width: 60%;
  margin-left: -4px;
  overflow: auto;
  padding-left: 15px;
  padding-right: 15px;
  background: white;
  border-radius: 5px;
  border: 1px solid ${Colors.outline};
`;

const PaneTitle = styled.div`
  min-width: 530px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
  padding-right: 5px;
  padding-top: 8px;
  padding-bottom: 8px;
  background: white;
  border-bottom: 1px solid ${Colors.outline};
`;

const StyledDivider = styled(Divider)`
  margin: 26px -40px 32px -40px;
`;

const ItemHeader = () => {
  return <StyledItemHeader container alignItems='center' spacing={1}>
    <Grid item xs={2}>
      <TranslatedText
        stringId="general.date.label"
        fallback="Date"
      />
    </Grid>
    <Grid item xs={4}>
      <TranslatedText
        stringId="invoice.modal.addInvoice.details.label"
        fallback="Details"
      />
    </Grid>
    <Grid item xs={1}>
      <ItemCodeText>
        <TranslatedText
          stringId="invoice.table.column.code"
          fallback="Code"
        />
      </ItemCodeText>
    </Grid>
    <Grid item xs={3}>
      <TranslatedText
        stringId="invoice.modal.addInvoice.orderedBy.label"
        fallback="Ordered by"
      />
    </Grid>
    <Grid item xs={2}>
      <PriceCell>
        <TranslatedText
          stringId="invoice.modal.addInvoice.price.label"
          fallback="Price"
        />
      </PriceCell>
    </Grid>
  </StyledItemHeader>
};

const ACTION_MODALS = {
  ADD_DISCOUNT: 'addDiscount',
  ADD_MARKUP: 'addMarkup',
  DELETE: 'delete',
}

const ItemRow = ({ index, hasBorderBottom, category, onDelete, rowData: defaultRowData, isDeleteDisabled }) => {
  const invoiceLineTypeSuggester = useSuggester('invoiceLineTypes');
  const practitionerSuggester = useSuggester('practitioner');
  const [actionModal, setActionModal] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [rowData, setRowData] = useState({
    code: defaultRowData?.type
      ? <TranslatedEnum
        prefix="invoice.line.property.type"
        value={defaultRowData.type}
        enumValues={INVOICE_LINE_TYPE_LABELS}
      /> : "",
    details: defaultRowData?.name || "",
    date: defaultRowData?.date || "",
    orderedBy: defaultRowData?.orderedBy || "",
    price: defaultRowData?.price || "",
  });

  const onOpenKebabMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseKebabMenu = () => {
    setAnchorEl(null);
  };

  const updateRowData = ({ itemType, price }) => {
    setRowData(prevRowData => ({
      ...prevRowData,
      code: <TranslatedEnum
        prefix="invoice.line.property.type"
        value={itemType}
        enumValues={INVOICE_LINE_TYPE_LABELS}
      />,
      price,
    }))
  };

  const handleActionModal = value => setActionModal(value);

  const handleDeleteItem = () => {
    onDelete();
    handleActionModal('')
  };

  return <StyledItemRow container alignItems='center' spacing={1} hasBorderBottom={hasBorderBottom}>
    <Grid item xs={2}>
      <Field
        name={"date_" + index}
        required
        component={DateField}
        saveDateAsString
        size="small"
      />
    </Grid>
    <Grid item xs={4}>
      <Field
        name={"invoiceLineTypeId_" + index}
        required
        component={AutocompleteField}
        suggester={invoiceLineTypeSuggester}
        customCallback={data => updateRowData(data)}
        size="small"
      />
    </Grid>
    <Grid item justifyContent='center' xs={1}>
      <ItemCodeText>
        {category || rowData.code}
      </ItemCodeText>
    </Grid>
    <Grid item xs={3}>
      <Field
        name={"orderedById_" + index}
        required
        component={AutocompleteField}
        suggester={practitionerSuggester}
        size="small"
      />
    </Grid>
    <Grid item xs={2}>
      <PriceCell>
        <PriceText>
          {rowData.price}
        </PriceText>
        <StyledIconButton
          onClick={onOpenKebabMenu}
        >
          <MoreVert />
        </StyledIconButton>
      </PriceCell>
      <StyledMenu
        anchorEl={anchorEl}
        getContentAnchorEl={null}
        open={open}
        onClose={handleCloseKebabMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <KebabMenuItem onClick={() => handleActionModal(ACTION_MODALS.ADD_DISCOUNT)}>
          <TranslatedText
            stringId="invoice.modal.editInvoice.addDiscount"
            fallback="Add discount"
          />
        </KebabMenuItem>
        <KebabMenuItem onClick={() => handleActionModal(ACTION_MODALS.ADD_MARKUP)}>
          <TranslatedText
            stringId="invoice.modal.editInvoice.addMarkup"
            fallback="Add markup"
          />
        </KebabMenuItem>
        <KebabMenuItem onClick={() => !isDeleteDisabled && handleActionModal(ACTION_MODALS.DELETE)}>
          <TranslatedText
            stringId="invoice.modal.editInvoice.delete"
            fallback="Delete"
          />
        </KebabMenuItem>
      </StyledMenu>
    </Grid>
    <DeleteItemModal
      open={actionModal === ACTION_MODALS.DELETE}
      onClose={() => handleActionModal('')}
      onDelete={handleDeleteItem}
      lineItems={rowData}
    />
  </StyledItemRow>
};

export const EditInvoiceModal = ({ open, onClose, invoiceId, displayId, invoiceLineItems }) => {
  const defaultRowList = invoiceLineItems.length ? invoiceLineItems.map(item => ({
    invoiceLineTypeId: item.invoiceLineTypeId,
    date: item.dateGenerated,
    orderedById: item.orderedById,
    price: item.invoiceLineType?.price,
  })) : [undefined];
  const [rowList, setRowList] = useState(defaultRowList);
  const [potentialLineItems, setPotentialLineItems] = useState([]);
  const [isEmpty, setIsEmpty] = useState(false);
  const api = useApi();

  const handleAddRow = (rowData) => {
    let newRowList = [...rowList];
    if (Array.isArray(rowData) && rowData.length) {
      rowData.forEach(newItem => {
        const idExists = newRowList.some(item => item && item.id === newItem.id);
        if (!idExists) {
          newRowList.push(newItem);
        }
      });
      setRowList(newRowList);
      return;
    }
    if (!!rowData) {
      newRowList.push(rowData);
      setRowList(newRowList);
      return;
    }
    newRowList.push(undefined);
    setRowList(newRowList);
  };

  const COLUMNS = [
    { key: 'date', title: 'Date', accessor: ({ date }) => <DateDisplay date={date} /> },
    { key: 'code', title: 'Code' },
    {
      key: 'type',
      title: 'Category',
      accessor: ({ type }) => (
        <TranslatedEnum
          prefix="invoice.line.property.type"
          value={type}
          enumValues={INVOICE_LINE_TYPE_LABELS}
        />
      ),
    },
    { key: 'orderedBy', title: 'Ordered by' },
    { key: 'price', title: 'Price', accessor: ({ price }) => `$${price}` },
    {
      accessor: (row) => (
        <SingleAddButton variant="outlined" onClick={() => handleAddRow(row)}>
          <TranslatedText stringId="general.action.add" fallback="Add" />
        </SingleAddButton>
      ),
    },
  ];

  useEffect(() => {
    setIsEmpty(false);
    if (potentialLineItems.length === rowList.filter(row => !!row).length) {
      setIsEmpty(true);
    }
  }, [potentialLineItems.length, rowList.length]);

  const onDataFetched = useCallback(({ data }) => {
    setPotentialLineItems(data);
  }, []);

  const rowStyle = ({ id }) => {
    const idList = rowList.map(row => row?.id).filter(id => !!id);
    if (idList.includes(id)) return "display: none;";
    return "";
  };

  const initialValues = rowList.reduce((accumulator, currentValue, currentIndex) => ({
    ...accumulator,
    ["date_" + currentIndex]: currentValue?.date || "",
    ["invoiceLineTypeId_" + currentIndex]: currentValue?.invoiceLineTypeId || "",
    ["price_" + currentIndex]: currentValue?.price || "",
    ["orderedById_" + currentIndex]: currentValue?.orderedById || "",
  }), {});

  const onDeleteLineItem = (index) => {
    setRowList(prevRowList => {
      const newRowList = [...prevRowList];
      newRowList.splice(index, 1);
      return newRowList;
    });
  };

  const handleSubmit = async (submitData) => {
    let invoiceLineItemsData = [];
    let i = 0;
    while (i < rowList.length) {
      let newInvoiceLineItemData = {
        invoiceLineTypeId: submitData[`invoiceLineTypeId_${i}`],
        date: submitData[`date_${i}`],
        orderedById: submitData[`orderedById_${i}`],
        price: submitData[`price_${i}`]
      };

      if (!!newInvoiceLineItemData.date) invoiceLineItemsData.push(newInvoiceLineItemData);
      i++;
    }

    await api.put(`invoices/${invoiceId}/lineItems`, { invoiceLineItemsData });
  };

  return (
    <Modal
      width="lg"
      title={
        <TranslatedText
          stringId="invoice.modal.view.title"
          fallback="Invoice number: :invoiceNumber"
          replacements={{ invoiceNumber: displayId }}
        />
      }
      open={open}
      onClose={onClose}
      overrideContentPadding
    >
      <Form
        enableReinitialize
        onSubmit={handleSubmit}
        initialValues={initialValues}
        render={({ submitForm }) => (
          <FormContainer>
            <ItemHeader />
            {rowList.map((row, index) => (
              <ItemRow
                key={row?.id}
                index={index}
                rowData={row}
                hasBorderBottom={index === rowList.length - 1}
                category={row?.type
                  ? <TranslatedEnum
                    prefix="invoice.line.property.type"
                    value={row.type}
                    enumValues={INVOICE_LINE_TYPE_LABELS}
                  /> : ""}
                onDelete={() => onDeleteLineItem(index)}
                isDeleteDisabled={rowList.length === 1}
              />
            ))}
            <LinkText onClick={() => handleAddRow()}>
              {"+ "}<TranslatedText stringId="invoice.modal.editInvoice.newRow" fallback="New row" />
            </LinkText>
            <PotentialLineItemsPane>
              <PaneTitle>
                <TranslatedText
                  stringId="invoice.modal.potentialInvoices.title"
                  fallback="Patient items to be added"
                />
                <BulkAddButton onClick={() => handleAddRow(potentialLineItems)}>
                  <TranslatedText stringId="general.action.addAll" fallback="Add all" />
                </BulkAddButton>
              </PaneTitle>
              <StyledDataFetchingTable
                endpoint={`invoices/${invoiceId}/potentialLineItems`}
                columns={COLUMNS}
                noDataMessage={
                  <TranslatedText
                    stringId="invoice.modal.potentialInvoices.table.noData"
                    fallback="No potential invoice line items found"
                  />
                }
                allowExport={false}
                rowStyle={rowStyle}
                onDataFetched={onDataFetched}
                headerColor='white'
                page={null}
                elevated={false}
                isDenseTable
                autoGeneratingIds
                isEmpty={isEmpty}
              />
            </PotentialLineItemsPane>
            <StyledDivider />
            <FormSubmitCancelRow
              confirmText={<TranslatedText stringId="general.action.save" fallback="Save" />}
              onConfirm={submitForm}
              onCancel={onClose}
            />
          </FormContainer>)}
      />
    </Modal>
  );
};
