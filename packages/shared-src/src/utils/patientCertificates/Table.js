import React from 'react';
import { StyleSheet, Text, View } from '@react-pdf/renderer';

const basicBorder = '1 solid black';

const tableStyles = StyleSheet.create({
  table: {
    borderTop: basicBorder,
  },
  tr: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderBottom: basicBorder,
    // borderBottom: basicBorder,
  },
  th: {
    flex: 1,
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    fontWeight: 500,
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

const TR = props => <View {...props} style={tableStyles.tr} />;
const TH = ({ customStyles, ...props }) => (
  <Text {...props} style={[tableStyles.th, customStyles]} />
);
const TD = ({ customStyles, ...props }) => (
  <Text wrap={false} {...props} style={[tableStyles.td, customStyles]} />
);

export const Table = ({ data, columns, getLocalisation, columnStyle }) => {
  const visibleColumns = columns.filter(
    ({ key }) => getLocalisation(`fields.${key}.hidden`) !== true,
  );
  return (
    <View style={tableStyles.table}>
      <TR>
        {visibleColumns.map(({ title, key, customStyles }, i) => (
          <TH
            key={key}
            customStyles={[customStyles, columnStyle, !i && { borderLeft: basicBorder }]}
          >
            {title}
          </TH>
        ))}
      </TR>
      {data.map((row, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <TR key={i}>
          {visibleColumns.map(({ accessor, key, customStyles }, j) => (
            <TD
              key={key}
              customStyles={[customStyles, columnStyle, !j && { borderLeft: basicBorder }]}
            >
              {accessor ? accessor(row, getLocalisation) : row[key]}
            </TD>
          ))}
        </TR>
      ))}
    </View>
  );
};
