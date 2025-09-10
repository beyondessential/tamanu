import { TAMANU_COLORS } from '@tamanu/ui-components';
import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@material-ui/core';
import { Colors } from '../../constants';

const Container = styled.div`
  border-radius: 3px;
  background: ${TAMANU_COLORS.white};
  table-layout: fixed;
  border: 1px solid ${TAMANU_COLORS.outline};
  padding: 0 20px;
`;

const StyledTable = styled(Table)`
  table-layout: fixed;
  tr {
    &:first-child td {
      padding-top: 20px;
    }
    &:last-child td {
      border-bottom: none;
      padding-bottom: 20px;
    }
  }

  tr td {
    // This is a hacky workaround to make sure that the cell contents are vertically aligned
    // If we use vertical-align center, the validation error messages break the table alignment
    > span,
    > button {
      position: relative;
      top: 10px;
    }
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
  padding: 5px;
  vertical-align: top;

  &:last-child {
    padding-right: 0;
  }

  &:first-child {
    padding-left: 0;
  }
`;

const StyledTableRow = styled(TableRow)`
  ${props =>
    props.$sectionStart &&
    css`
      td {
        padding-top: 20px;
      }
    `};

  ${props =>
    props.$sectionEnd &&
    css`
      border-bottom: 1px solid ${TAMANU_COLORS.outline};
      td {
        padding-bottom: 20px;
      }
    `};

  ${props =>
    props.$hasAddButton &&
    css`
      td {
        padding-bottom: 40px !important;
      }
    `};
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
                    const isFirst = groupIndex > 0 && i === 0;
                    // Show a bottom border if it is the end of a section
                    const isLast =
                      groupIndex < Object.keys(data).length - 1 && i === groupData.length - 1;
                    const hasAddButton = i === groupData.length - 1 && groupIndex === 0;

                    return (
                      <StyledTableRow
                        key={rowData.id || `${groupName}-${i}`}
                        $sectionStart={isFirst}
                        $sectionEnd={isLast}
                        $hasAddButton={hasAddButton}
                      >
                        {columns.map(({ key, accessor }) => (
                          <StyledTableDataCell key={key}>
                            {accessor(rowData, groupName, i)}
                          </StyledTableDataCell>
                        ))}
                      </StyledTableRow>
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
      }),
    ),
    // Case 2: Grouped data (Object where values are arrays of objects)
    PropTypes.objectOf(
      PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          name: PropTypes.string,
          date: PropTypes.string,
        }),
      ),
    ),
  ]).isRequired,
  className: PropTypes.string,
};
