import React, { useRef } from 'react';
import styled from 'styled-components';
import { Pagination, PaginationItem } from '@material-ui/lab';
import { Select, MenuItem } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Colors } from '../../constants';
import { ChevronIcon } from '../Icons/ChevronIcon';

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
        margin: 0 3px;
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
`;

const PageRecordCount = styled.span`
  margin-right: 15px;
  font-size: 13px;
`;

const StyledSelectField = styled(Select)`
  border: 1px ${Colors.outline} solid;
  border-radius: 20px;
  width: 60px;
  height: 26px;
  text-align: center;
  overflow: hidden;
  font-size: 13px;
  .MuiSelect-select:focus {
    background: none;
  }
  &.MuiInput-underline:before,
  &.MuiInput-underline:after,
  &.MuiInput-underline:hover:before {
    border-bottom: none;
  }
  .MuiSelect-icon {
    top: initial;
    right: 12px;
  }
`;

const StyledMenuItem = styled(MenuItem)`
  font-size: 13px;
`;

const PreviousButton = styled(ChevronIcon)`
  padding: 8px;
  transform: rotate(90deg);
`;

const NextButton = styled(ChevronIcon)`
  padding: 8px;
  transform: rotate(-90deg);
`;

const useStyles = makeStyles({
  select: {
    borderRadius: 3,
    '& ul': {
      backgroundColor: Colors.white,
      padding: 0,
    },
    '& li': {
      borderRadius: 4,
      margin: 3,
    },
    '& li:hover': {
      backgroundColor: Colors.veryLightBlue,
    },
  },
});

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
    const wasLastItemEllipses = useRef(false);
    const classes = useStyles();
    const lowerRange = count > 0 ? page * rowsPerPage + 1 : 0;
    const upperRange = count > rowsPerPage ? (page + 1) * rowsPerPage : count;

    return (
      <PaginatorWrapper colSpan={colSpan}>
        <FooterContent>
          <PageRecordCount>
            {lowerRange}-{upperRange} of {count}
          </PageRecordCount>
          <StyledSelectField
            label="Rows per page"
            onChange={onRowsPerPageChange}
            value={rowsPerPage || rowsPerPageOptions[0]}
            IconComponent={ChevronIcon}
            MenuProps={{ classes: { paper: classes.select } }}
          >
            {rowsPerPageOptions.map(option => (
              <StyledMenuItem value={option}>{option}</StyledMenuItem>
            ))}
          </StyledSelectField>
          <StyledPagination
            size="small"
            count={numberOfPages}
            variant="outlined"
            onChange={onPageChange}
            renderItem={item => {
              // Set custom icons for navigation buttons
              if (item.type === 'previous') {
                return <PaginationItem {...item} component={PreviousButton} />;
              }
              if (item.type === 'next') {
                return <PaginationItem {...item} component={NextButton} />;
              }

              // We needed some custom logic for what page numbers to show that couldnt be done through the built in boundaryCount and siblingcount props
              // so I needed to create a set of conditions to determine what page numbers to show and when to show ellipses.
              const selectedPage = page + 1;
              const pageNumber = item.page;

              // The standard range for showing page numbers except for the first and last page which
              // we override above is the current page +/- 1
              const standardRange =
                selectedPage >= pageNumber - 1 && selectedPage <= pageNumber + 1;
              // When we are on the first page, we want to show the first 3 pages and the last page however and when
              // we are on the last page we want to show the last 3 pages and the first page.
              const startRange = selectedPage === 1 && pageNumber <= 3;
              const endRange = selectedPage === numberOfPages && pageNumber >= numberOfPages - 2;

              const isInRange = standardRange || startRange || endRange;

              // We always want to show the first or last page
              const isEndPage = pageNumber === 1 || pageNumber === numberOfPages;

              // We dont want to include any ellipsis as we make our own in this custom logic
              const isEllipses = item.type === 'start-ellipsis' || item.type === 'end-ellipsis';

              // Conditionally show the page number button if it falls within the defined ranges above
              if ((isInRange || isEndPage) && !isEllipses) {
                wasLastItemEllipses.current = false;
                return <PaginationItem {...item} />;
              }
              // If the item falls out of the defined range and is not the first or last page, show an ellipses
              // however we only want to show one ellipses in a row so we need to keep track of the last item
              // and dont show if one was rendered before in the list
              if (!wasLastItemEllipses.current) {
                wasLastItemEllipses.current = true;
                return <PaginationItem size="small" type="start-ellipsis" />;
              }
              return null;
            }}
          />
        </FooterContent>
      </PaginatorWrapper>
    );
  },
);
