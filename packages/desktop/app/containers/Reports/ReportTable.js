import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Table } from '../../components/Table';
import { SaveSpreadsheetButton } from '../../components/SaveSpreadsheetButton';

const dataColumns = [
  {
    accessor: record => record.formatted,
    key: 'item',
    sortable: true,
    title: 'Item',
  },
  {
    accessor: record => record.amount,
    key: 'amount',
    sortable: true,
    title: 'Amount',
  },
];

const buttonContainerStyle = {
  marginBottom: '0.5rem',
  textAlign: 'right',
};

export const ReportTable = ({ data }) => {
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState(dataColumns[0].key);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const sortedData = data.sort(({ [orderBy]: a }, { [orderBy]: b }) => {
    if (typeof a === 'string') {
      return order === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    }
    return order === 'asc' ? a - b : b - a;
  });

  const pagedData = sortedData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const changeOrderBy = columnKey => {
    const isDesc = orderBy === columnKey && order === 'desc';
    setOrder(isDesc ? 'asc' : 'desc');
    setOrderBy(columnKey);
  };

  return (
    <div>
      <div style={buttonContainerStyle}>
        <SaveSpreadsheetButton filename="report" data={data} columns={dataColumns} />
      </div>
      <div>{rowsPerPage}</div>
      <Table
        columns={dataColumns}
        count={data.length}
        data={pagedData}
        onChangeOrderBy={changeOrderBy}
        onChangePage={setPage}
        onChangeRowsPerPage={setRowsPerPage}
        order={order}
        orderBy={orderBy}
        page={page}
        rowsPerPage={rowsPerPage}
      />
    </div>
  );
};

ReportTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
};
