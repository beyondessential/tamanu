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

const getSectionInfo = (row, rowIndex, data, getRowSectionLabel, visibleColumnsLength) => {
  if (typeof getRowSectionLabel !== 'function') {
    return { sectionLabel: null, shouldRenderSection: false };
  }
  const label = getRowSectionLabel(row);
  if (!label || !visibleColumnsLength) {
    return { sectionLabel: null, shouldRenderSection: false };
  }
  if (rowIndex === 0) {
    return { sectionLabel: label, shouldRenderSection: true };
  }
  const previousLabel = getRowSectionLabel(data[rowIndex - 1]);
  return {
    sectionLabel: label,
    shouldRenderSection: label !== previousLabel,
  };
};

const SectionRow = ({ label, columns, columnStyle, bodyStyleOverrides }) => (
  <TR style={{ borderTopWidth: 0 }}>
    {columns.map((column, columnIndex) => {
      const { key, customStyles } = column;
      const baseStyle =
        columnIndex === 0 ? { ...columnStyle, borderLeft: basicBorder } : columnStyle;
      const isLastColumn = columnIndex === columns.length - 1;
      const sectionCellStyles = [
        baseStyle,
        customStyles,
        bodyStyleOverrides,
        // Remove inner column dividers so the section label looks like a single row.
        isLastColumn ? { borderLeftWidth: 0 } : { borderRightWidth: 0 },
      ].filter(Boolean);

      return (
        <TD key={key} customStyles={sectionCellStyles} bold={columnIndex === 0}>
          {columnIndex === 0 ? label : ''}
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
  hideRowDividers = false,
  headerStyleOverrides,
  bodyStyleOverrides,
  getRowSectionLabel,
}) => {
  const leftColumnStyle = {
    ...columnStyle,
    borderLeft: basicBorder,
  };
  const visibleColumns = columns.filter(({ key }) => getSetting(`fields.${key}.hidden`) !== true);
  return (
    <View style={tableStyles.table}>
      <TR fixed>
        {visibleColumns.map(({ title, key, customStyles, headerStyles }, columnIndex) => {
          const baseStyle = columnIndex === 0 ? leftColumnStyle : columnStyle;
          const headerCustomStyles = [baseStyle, customStyles, headerStyles, headerStyleOverrides];
          return (
            <TH key={key} customStyles={headerCustomStyles}>
              {title}
            </TH>
          );
        })}
      </TR>
      {data.map((row, rowIndex) => {
        const { sectionLabel, shouldRenderSection } = getSectionInfo(
          row,
          rowIndex,
          data,
          getRowSectionLabel,
          visibleColumns.length,
        );
        const bodyRowStyle = getBodyRowStyle(rowIndex, data.length, hideRowDividers);
        return (
          <React.Fragment key={rowIndex}>
            {shouldRenderSection && (
              <SectionRow
                label={sectionLabel}
                columns={visibleColumns}
                columnStyle={columnStyle}
                bodyStyleOverrides={bodyStyleOverrides}
              />
            )}
            <TR style={bodyRowStyle}>
              {visibleColumns.map((column, columnIndex) => {
                const { accessor, key, customStyles } = column;
                const baseStyle = columnIndex === 0 ? leftColumnStyle : columnStyle;
                // If this row belongs to a section, indent the first column using textIndent
                // instead of padding, so the column width remains consistent.
                const indentStyle =
                  sectionLabel && columnIndex === 0 ? { textIndent: 6 } : null;
                const cellStyles = [
                  baseStyle,
                  customStyles,
                  bodyStyleOverrides,
                  indentStyle,
                ].filter(Boolean);

                return (
                  <TD key={key} customStyles={cellStyles}>
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
