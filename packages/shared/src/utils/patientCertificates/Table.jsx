import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { CustomStyleSheet } from '../renderPdf';

const basicBorder = '1 solid black';

const tableStyles = CustomStyleSheet.create({
  tr: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderBottom: basicBorder,
    borderTop: basicBorder,
    marginBottom: -1,
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

const TR = props => <View {...props} style={tableStyles().tr} />;
const TH = ({ customStyles, language, ...props }) => (
  <Text {...props} style={[tableStyles(language).th, customStyles]} />
);
const TD = ({ customStyles, language, ...props }) => (
  <Text wrap={false} {...props} style={[tableStyles(language).td, customStyles]} />
);

export const Table = ({ data, columns, getLocalisation, columnStyle, language }) => {
  const leftColumnStyle = {
    ...columnStyle,
    borderLeft: basicBorder,
  };
  const visibleColumns = columns.filter(
    ({ key }) => getLocalisation(`fields.${key}.hidden`) !== true,
  );
  return (
    <View style={tableStyles(language).table}>
      <TR fixed>
        {visibleColumns.map(({ title, key, customStyles }, columnIndex) => (
          <TH
            key={key}
            language={language}
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
              language={language}
              customStyles={[customStyles, columnIndex === 0 ? leftColumnStyle : columnStyle]}
            >
              {accessor ? accessor(row, getLocalisation) : row[key]}
            </TD>
          ))}
        </TR>
      ))}
    </View>
  );
};
