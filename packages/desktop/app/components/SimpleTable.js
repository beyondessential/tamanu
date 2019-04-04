import React from 'react';
import ReactTable from 'react-table';
import PropTypes from 'prop-types';
import { Notification } from './Notification';

export function SimpleTable({
  data, columns, emptyNotification, ...props
}) {
  return (
    data && data.length > 0
      ? (
        <ReactTable
          style={{ flexGrow: 1 }}
          keyField="_id"
          data={data}
          pageSize={data.length}
          columns={columns}
          className="-striped"
          defaultSortDirection="asc"
          showPagination={false}
          {...props}
        />
      )
      : <Notification message={emptyNotification} />
  );
}

SimpleTable.propTypes = {
  data: PropTypes.arrayOf(Object).isRequired,
  columns: PropTypes.arrayOf(Object).isRequired,
  emptyNotification: PropTypes.node,
};

SimpleTable.defaultProps = {
  emptyNotification: '',
};
