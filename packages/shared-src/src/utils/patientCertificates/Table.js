import React from 'react';
import { StyleSheet, Text, View } from '@react-pdf/renderer';

const tableStyles = StyleSheet.create({
  table: {
    borderTop: '1 solid black',
    borderLeft: '1 solid black',
  },
  tr: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderBottom: '1 solid black',
  },
  th: {
    flex: 1,
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    fontWeight: 500,
    padding: 3,
    borderRight: '1 solid black',
    margin: 0,
  },
  td: {
    flex: 1,
    padding: 3,
    fontSize: 10,
    margin: 0,
    borderRight: '1 solid black',
  },
});

const TR = props => <View {...props} style={tableStyles.tr} />;
const TH = ({ customStyles, ...props }) => (
  <Text {...props} style={[tableStyles.th, customStyles]} />
);
const TD = ({ customStyles, ...props }) => (
  <Text {...props} style={[tableStyles.td, customStyles]} />
);

export const Table = ({ data, columns }) => {
  return (
    <View style={tableStyles.table}>
      <TR>
        {columns.map(({ title, key, customStyles }) => (
          <TH key={key} customStyles={customStyles}>
            {title}
          </TH>
        ))}
      </TR>
      {data.map((row, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <TR key={i}>
          {columns.map(({ accessor, key, customStyles }) => (
            <TD key={key} customStyles={customStyles}>
              {accessor ? accessor(row) : row[key]}
            </TD>
          ))}
        </TR>
      ))}
    </View>
  );
};
