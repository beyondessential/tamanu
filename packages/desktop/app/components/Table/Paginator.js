import React from 'react';
import styled from 'styled-components';
import { Pagination } from '@material-ui/lab';
import { Select, MenuItem } from '@material-ui/core';
import { Colors } from '../../constants';

const PaginatorWrapper = styled.td``;

const FooterContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const StyledPagination = styled(Pagination)`
  margin-right: 20px;
  ul {
    li {
      .MuiPaginationItem-page {
        border: 1px solid ${Colors.outline};
        font-size: 13px;
      }
      .MuiPaginationItem-page.Mui-selected {
        background: ${Colors.primary};
        border: none;
        color: ${Colors.white};
      }
      &:first-child,
      &:last-child {
        .MuiPaginationItem-page {
          border: none;
        }
      }
    }
  }
`;

const PageRecordCount = styled.span`
  margin-left: 20px;
  font-size: 13px;
`;

const StyledSelectField = styled(Select)`
  border: 1px ${Colors.outline} solid;
  border-radius: 20px;
  width: 70px;
  text-align: center;
  overflow: hidden;
  font-size: 13px;
  &.MuiInput-underline:before,
  &.MuiInput-underline:after,
  &.MuiInput-underline:hover:before {
    border-bottom: none;
  }
`;

export const Paginator = React.memo(
  ({
    page,
    colSpan,
    count,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
    rowsPerPageOptions,
  }) => {
    const numberOfPages = Math.ceil(count / rowsPerPage);
    return (
      <PaginatorWrapper colSpan={colSpan}>
        <FooterContent>
          <StyledSelectField
            label="Rows per page"
            onChange={onRowsPerPageChange}
            value={rowsPerPage || rowsPerPageOptions[0]}
          >
            {rowsPerPageOptions.map(option => (
              <MenuItem value={option}>{option}</MenuItem>
            ))}
          </StyledSelectField>
          <PageRecordCount>
            {page * rowsPerPage + 1}-{page * rowsPerPage + rowsPerPage} of {count}
          </PageRecordCount>
          <StyledPagination count={numberOfPages} variant="outlined" onChange={onPageChange} />
        </FooterContent>
      </PaginatorWrapper>
    );
  },
);
