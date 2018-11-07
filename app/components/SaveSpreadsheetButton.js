import React, { Component } from 'react';
import PropTypes from 'prop-types';
import XLSX from 'xlsx'; 
import ReactTable from 'react-table';

import { SaveFileButton } from './SaveFileButton';

// for save file dialog
const filters = [{
  name: 'Excel files (*.xlsx)',
  extensions: ['xlsx'],
}];

export class SaveSpreadsheetButton extends Component {

  propTypes = {
    ...ReactTable.propTypes,
    filename: PropTypes.string,
  }

  writeData = async (path) => {
    const { data, columns } = this.props;

    // exclude columns that have exporter explicitly set to null
    const exportColumns = columns.filter(c => c.exporter !== null);

    // assemble array of rows based on ReactTable format
    const buildCell = (row, column) => {
      const { exporter, accessor } = column;
      if(exporter) {
        // we have an explicit exporter set
        return exporter(row);
      } else if(accessor) {
        // accessor can be a callback or a string key
        return (typeof(accessor) === 'function') ? accessor(row) : row[accessor];
      } else {
        // nothing set for this cell
        return '';
      }
    };

    // convert to excel format
    const buildRow = row => exportColumns.map(c => buildCell(row, c));
    const rows = data.map(buildRow);
    const headers = exportColumns.map(c => c.Header);
      
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    
    // create workbook and write it
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet);
    XLSX.writeFile(book, path);
  }

  render() {
    return (
      <SaveFileButton 
        { ...this.props }
        filters={ filters }
        writeFunction={ this.writeData }
      >Export report (.xlsx)</SaveFileButton>
    );
  }
}
