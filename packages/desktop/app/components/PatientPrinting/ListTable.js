import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const Table = styled.table`
  border: 1px solid black;
  margin-top: 10px;
  margin-bottom: 16px;
  border-spacing: 0px;
  border-collapse: collapse;
  width: 100%;
  page-break-inside: auto;
`;

const Row = styled.tr`
  border-bottom: 1px solid black;
  page-break-inside: avoid;
  page-break-after: always;
`;

const Header = styled.th`
  border-right: 1px solid black;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  font-weight: 600;
`;

const Cell = styled.td`
  border-right: 1px solid black;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  font-size: 14px;
`;

export const ListTable = ({ columns, data, className }) => {
  return (
    <Table className={className}>
      <thead>
        <Row>
          {columns.map(({ key, title, style }) => (
            <Header key={key} style={{ paddingLeft: '0.5rem', ...style }}>
              {title}
            </Header>
          ))}
        </Row>
      </thead>
      <tbody>
        {data.map(row => (
          <Row key={row.id}>
            {columns.map(({ key, accessor, style }) => (
              <Cell key={key} style={{ paddingLeft: '0.5rem', ...style }}>
                {accessor ? accessor(row) : row[key]}
              </Cell>
            ))}
          </Row>
        ))}
      </tbody>
    </Table>
  );
};

ListTable.propTypes = {
  columns: PropTypes.array.isRequired,
  data: PropTypes.array.isRequired,
};
