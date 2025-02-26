import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@material-ui/core';
import { Colors } from '../../constants';

const Container = styled.div`
  border-radius: 3px;
  background: ${Colors.white};
  table-layout: fixed;
  border: 1px solid ${Colors.outline};
  padding: 0 20px;
`;

const StyledTable = styled(Table)`
  table-layout: fixed;
  tr:last-child td {
    border-bottom: none;
  }
`;

const StyledTableHeaderCell = styled(TableCell)`
  width: ${props => (props.width ? props.width : 'auto')};
  padding: 10px 5px;

  &:last-child {
    padding-right: 0;
  }

  &:first-child {
    padding-left: 0;
  }
`;

const StyledTableDataCell = styled(TableCell)`
  padding: 30px 5px;

  &:last-child {
    padding-right: 0;
  }

  &:first-child {
    padding-left: 0;
  }
`;

export const FormTable = React.memo(({ columns, data, className = '' }) => {
  // Check if data is grouped (object) or ungrouped (array)
  const isGrouped = !Array.isArray(data);

  return (
    <Container className={className}>
      <StyledTable>
        <TableHead>
          <TableRow>
            {columns.map(({ key, title, width }) => (
              <StyledTableHeaderCell key={key} width={width}>
                {title}
              </StyledTableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {isGrouped
            ? // Handle grouped data
              Object.entries(data).map(([groupName, groupData], groupIndex) => (
                <React.Fragment key={groupName}>
                  {groupData.map((rowData, i) => {
                    // Is it the last group in the table
                    const isLast = groupIndex === Object.keys(data).length - 1;
                    // Is it the last row in the group
                    const showBorder = !isLast && i === groupData.length - 1;

                    return (
                      <TableRow
                        key={rowData.id || `${groupName}-${i}`}
                        style={{
                          borderBottom: showBorder ? `1px solid ${Colors.outline}` : 'none',
                        }}
                      >
                        {columns.map(({ key, accessor }) => (
                          <StyledTableDataCell key={key}>
                            {accessor(rowData, groupName, i)}
                          </StyledTableDataCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              ))
            : // Handle ungrouped data
              data.map((rowData, i) => (
                <TableRow key={rowData.id || i}>
                  {columns.map(({ key, accessor }) => (
                    <StyledTableDataCell key={key}>{accessor(rowData, i)}</StyledTableDataCell>
                  ))}
                </TableRow>
              ))}
        </TableBody>
      </StyledTable>
    </Container>
  );
});

FormTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      width: PropTypes.string,
      accessor: PropTypes.func.isRequired,
    }),
  ).isRequired,
  data: PropTypes.oneOfType([
    // Case 1: Ungrouped data (Array of objects)
    PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        date: PropTypes.string,
        conditionCategory: PropTypes.string,
      }),
    ),
    // Case 2: Grouped data (Object where values are arrays of objects)
    PropTypes.objectOf(
      PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          name: PropTypes.string,
          date: PropTypes.string,
          conditionCategory: PropTypes.string,
        }),
      ),
    ),
  ]).isRequired,
  className: PropTypes.string,
};
