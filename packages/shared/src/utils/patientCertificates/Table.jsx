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

const getHiddenRowDividerStyle = (index, rowCount) => {
  if (index === rowCount - 1) return { borderTopWidth: 0 };
  return { borderTopWidth: 0, borderBottomWidth: 0 };
};

const SectionRow = ({ label, columns, columnStyle }) => (
  <TR style={{ borderTopWidth: 0 }}>
    {columns.map(({ key, customStyles = {} }, index) => {
      const isFirst = index === 0;
      const isLast = index === columns.length - 1;
      const sectionCellStyles = [
        columnStyle,
        customStyles,
        isFirst ? { borderLeft: basicBorder } : {},
        // Remove inner column dividers so the section label looks like a single row.
        isLast ? { borderLeftWidth: 0 } : { borderRightWidth: 0 },
      ];
      return (
        <TD key={key} customStyles={sectionCellStyles} bold>
          {isFirst ? label : ''}
        </TD>
      );
    })}
  </TR>
);

export const Table = ({
  data,
  columns,
  getLocalisation,
  getSetting,
  columnStyle,
  headerStyle,
  hideRowDividers = false,
  getRowSectionLabel,
}) => {
  const visibleColumns = columns.filter(({ key }) => getSetting(`fields.${key}.hidden`) !== true);
  return (
    <View style={tableStyles.table}>
      <TR fixed>
        {visibleColumns.map(({ title, key, customStyles }, index) => {
          const firstColumnStyle = index === 0 ? { borderLeft: basicBorder } : {};
          return (
            <TH key={key} customStyles={[columnStyle, customStyles, headerStyle, firstColumnStyle]}>
              {title}
            </TH>
          );
        })}
      </TR>
      {data.map((row, rowIndex) => {
        const sectionLabel = getRowSectionLabel?.(row);
        const lastSectionLabel = rowIndex > 0 ? getRowSectionLabel?.(data[rowIndex - 1]) : null;
        const shouldRenderSection = sectionLabel && sectionLabel !== lastSectionLabel;
        return (
          <React.Fragment key={rowIndex}>
            {shouldRenderSection && (
              <SectionRow label={sectionLabel} columns={visibleColumns} columnStyle={columnStyle} />
            )}
            <TR
              style={hideRowDividers ? getHiddenRowDividerStyle(rowIndex, data.length) : undefined}
            >
              {visibleColumns.map(({ accessor, key, customStyles = {} }, index) => {
                const firstColumnStyle =
                  index === 0 ? { borderLeft: basicBorder, textIndent: sectionLabel ? 6 : 0 } : {};
                return (
                  <TD key={key} customStyles={[columnStyle, customStyles, firstColumnStyle]}>
                    {accessor ? accessor(row, getLocalisation, getSetting) : row[key]}
                  </TD>
                );
              })}
            </TR>
          </React.Fragment>
        );
      })}
    </View>
  );
};
