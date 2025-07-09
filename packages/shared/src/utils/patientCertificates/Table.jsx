import React from 'react';
import { StyleSheet, View } from '@react-pdf/renderer';
import { Text } from '../pdf/Text';
import { useLanguageContext } from '../pdf/languageContext';

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

const TR = props => <View {...props} style={tableStyles.tr} />;
const TH = ({ customStyles, ...props }) => {
  const { pdfFontBold } = useLanguageContext();
  return <Text {...props} style={[tableStyles.th, customStyles, { fontFamily: pdfFontBold }]} />;
};
const TD = ({ customStyles, ...props }) => (
  <Text wrap={false} {...props} style={[tableStyles.td, customStyles]} />
);

export const Table = ({ data, columns, getLocalisation, getSetting, columnStyle }) => {
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
      {data.map((row, rowIndex) => (
        // eslint-disable-next-line react/no-array-index-key
        <TR key={rowIndex}>
          {visibleColumns.map(({ accessor, key, customStyles }, columnIndex) => (
            <TD
              key={key}
              customStyles={[customStyles, columnIndex === 0 ? leftColumnStyle : columnStyle]}
            >
              {accessor ? accessor(row, getLocalisation, getSetting) : row[key]}
            </TD>
          ))}
        </TR>
      ))}
    </View>
  );
};
