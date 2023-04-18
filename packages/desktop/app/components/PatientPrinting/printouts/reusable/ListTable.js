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
`;

const Row = styled.tr`
  border-bottom: 1px solid black;
`;

const Header = styled.th`
  border-right: 1px solid black;
  padding-top: 0.5rem;
  padding-left: 0.5rem;
  padding-bottom: 0.5rem;
  font-weight: 600;
  text-align: left;
`;

const Cell = styled.td`
  border-right: 1px solid black;
  padding-top: 0.5rem;
  padding-left: 0.5rem;
  padding-bottom: 0.5rem;
  font-size: 14px;
`;

export const ListTable = ({ columns, data, className }) => {
  const totalWidth = columns.reduce((sum, c) => sum + c.widthProportion || 1, 0);
  const getWidth = widthProportion => `${(widthProportion / totalWidth) * 100}%`;
  return (
    <Table className={className}>
      <thead>
        <Row>
          {columns.map(({ key, title, style, widthProportion = 1 }) => (
            <Header key={key} style={{ width: getWidth(widthProportion), ...style }}>
              {title}
            </Header>
          ))}
        </Row>
      </thead>
      <tbody>
        {data.map(row => (
          <Row key={row.id}>
            {columns.map(({ key, accessor, style, widthProportion = 1 }) => (
              <Cell
                key={key}
                style={{
                  width: getWidth(widthProportion),
                  ...style,
                }}
              >
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
