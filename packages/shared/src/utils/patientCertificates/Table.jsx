import React from 'react';
import { StyleSheet, View } from '@react-pdf/renderer';
import { Text } from '../pdf/Text';

const basicBorder = '1 solid black';

const tableStyles = StyleSheet.create({
  tr: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderBottom: basicBorder,
    borderTop: basicBorder,
    marginBottom: -1,
  },
  th: {
    flex: 1,
    fontSize: 10,
    fontWeight: 700,
    padding: 3,
    borderRight: basicBorder,
    margin: 0,
  },
  td: {
    flex: 1,
    padding: 3,
    fontSize: 10,
    margin: 0,
    borderRight: basicBorder,
  },
});

const TR = ({ style, ...props }) => <View {...props} style={[tableStyles.tr, style]} />;
const TH = ({ customStyles, ...props }) => (
  <Text bold {...props} style={[tableStyles.th, customStyles]} />
);
const TD = ({ customStyles, ...props }) => (
  <Text wrap={false} {...props} style={[tableStyles.td, customStyles]} />
);

const getBodyRowStyle = (rowIndex, rowCount, hideRowDividers) => {
  if (!hideRowDividers) return undefined;
  const isLastRow = rowIndex === rowCount - 1;
  if (isLastRow) return { borderTopWidth: 0 };
  return { borderTopWidth: 0, borderBottomWidth: 0 };
};

export const Table = ({
  data,
  columns,
  getLocalisation,
  getSetting,
  columnStyle,
  hideRowDividers = false,
}) => {
  const leftColumnStyle = {
    ...columnStyle,
    borderLeft: basicBorder,
  };
  const visibleColumns = columns.filter(({ key }) => getSetting(`fields.${key}.hidden`) !== true);
  return (
    <View style={tableStyles.table}>
      <TR fixed>
        {visibleColumns.map(({ title, key, customStyles }, columnIndex) => (
          <TH
            key={key}
            customStyles={[customStyles, columnIndex === 0 ? leftColumnStyle : columnStyle]}
          >
            {title}
          </TH>
        ))}
      </TR>
      {data.map((row, rowIndex) => {
        const bodyRowStyle = getBodyRowStyle(rowIndex, data.length, hideRowDividers);

        return (
          <TR key={rowIndex} style={bodyRowStyle}>
            {visibleColumns.map(({ accessor, key, customStyles }, columnIndex) => (
              <TD
                key={key}
                customStyles={[customStyles, columnIndex === 0 ? leftColumnStyle : columnStyle]}
              >
                {accessor ? accessor(row, getLocalisation, getSetting) : row[key]}
              </TD>
            ))}
          </TR>
        );
      })}
    </View>
  );
};
