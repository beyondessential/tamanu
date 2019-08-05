/**
 * Tupaia MediTrak
 * Copyright (c) 2018 Beyond Essential Systems Pty Ltd
 */

import React from 'react';
import PropTypes from 'prop-types';
import MaterialTable from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableFooter from '@material-ui/core/TableFooter';
import TablePagination from '@material-ui/core/TablePagination';

const Row = React.memo(({ children, onClick, data }) => (
  <TableRow onClick={() => onClick(data)} style={{ marginTop: '1rem' }}>
    {children}
  </TableRow>
));

const ErrorCell = React.memo(({ colSpan, errorMessage }) => (
  <TableCell colSpan={colSpan} align="center">
    {errorMessage}
  </TableCell>
));

export class Table extends React.PureComponent {
  handleChangePage = (event, page) => {
    const { onChangePage } = this.props;
    if (onChangePage) onChangePage(page);
  };

  handleChangeRowsPerPage = event => {
    const { value: rowsPerPage } = event.target;
    const { onChangeRowsPerPage } = this.props;
    if (onChangeRowsPerPage) onChangeRowsPerPage(rowsPerPage);
  };

  getErrorMessage() {
    const { errorMessage, data, isLoading } = this.props;
    if (isLoading) return 'Loading...';
    if (errorMessage) return errorMessage;
    if (data.length === 0) return 'No data found';
    return null;
  }

  renderHeaders = () =>
    Object.values(this.props.columns).map(name => <TableCell>{name}</TableCell>);

  renderRowContent = (data, key) => {
    const { CustomCellComponents } = this.props;
    const value = data[key];
    const CustomComponent = CustomCellComponents[key];
    return (
      <TableCell>
        {CustomComponent ? <CustomComponent value={value} data={data} key={key} /> : value}
      </TableCell>
    );
  };

  renderRow = data => {
    const { columns, onRowClick, RowComponent } = this.props;
    const rowContent = Object.keys(columns).map(key => this.renderRowContent(data, key));
    return <RowComponent onClick={() => onRowClick(data)}>{rowContent}</RowComponent>;
  };

  renderError = errorMessage => {
    const { columns, RowComponent } = this.props;
    return (
      <RowComponent>
        <ErrorCell colSpan={Object.keys(columns).length} errorMessage={errorMessage} />
      </RowComponent>
    );
  };

  renderBodyContent = () => {
    const { data } = this.props;
    const errorMessage = this.getErrorMessage();
    if (errorMessage) {
      return this.renderError(errorMessage);
    }
    return data.map(rowData => this.renderRow(rowData));
  };

  renderPaginator = () => {
    const { count, page, rowsPerPage } = this.props;
    return (
      <TableRow>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          colSpan={3}
          page={page}
          count={count}
          rowsPerPage={rowsPerPage}
          SelectProps={{
            inputProps: { 'aria-label': 'rows per page' },
            native: true,
          }}
          onChangePage={this.handleChangePage}
          onChangeRowsPerPage={this.handleChangeRowsPerPage}
        />
      </TableRow>
    );
  };

  render() {
    const { page } = this.props;
    return (
      <MaterialTable>
        <TableHead>{this.renderHeaders()}</TableHead>
        <TableBody>{this.renderBodyContent()}</TableBody>
        {page !== undefined && <TableFooter>{this.renderPaginator()}</TableFooter>}
      </MaterialTable>
    );
  }
}

Table.propTypes = {
  columns: PropTypes.shape({}).isRequired,
  data: PropTypes.arrayOf(PropTypes.shape({})),
  errorMessage: PropTypes.string,
  isLoading: PropTypes.bool.isRequired,
  count: PropTypes.number,
  onChangePage: PropTypes.func.isRequired,
  onChangeRowsPerPage: PropTypes.func.isRequired,
  onSortedChange: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  sorting: PropTypes.array.isRequired,
  CustomCellComponents: PropTypes.shape({}),
  RowComponent: PropTypes.element,
};

Table.defaultProps = {
  data: [],
  errorMessage: '',
  count: 0,
  CustomCellComponents: {},
  RowComponent: Row,
};
