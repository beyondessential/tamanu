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

const SectionRow = ({ label, columnStyle }) => (
  <TR style={{ borderTopWidth: 0 }}>
    <TD customStyles={[columnStyle, { borderLeft: basicBorder }]} bold>
      {label}
    </TD>
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
  const getSectionConfig = (row, rowIndex) => {
    const sectionLabel = getRowSectionLabel?.(row);
    if (!sectionLabel) return { sectionLabel: null, shouldRenderSection: false };
    const lastSectionLabel = rowIndex > 0 ? getRowSectionLabel?.(data[rowIndex - 1]) : null;
    return { sectionLabel, shouldRenderSection: sectionLabel !== lastSectionLabel };
  };
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
        const { sectionLabel, shouldRenderSection } = getSectionConfig(row, rowIndex);
        return (
          <React.Fragment key={rowIndex}>
            {shouldRenderSection && (
              <SectionRow label={sectionLabel} columnStyle={columnStyle} />
            )}
            <TR
              style={hideRowDividers ? getHiddenRowDividerStyle(rowIndex, data.length) : undefined}
            >
              {visibleColumns.map(({ accessor, key, customStyles = {} }, index) => {
                const isFirstColumn = index === 0;
                return (
                <TD
                  key={key}
                  customStyles={[
                    columnStyle,
                    customStyles,
                    isFirstColumn && { borderLeft: basicBorder },
                    // Indent the first column if belongs to a section
                    isFirstColumn && sectionLabel && { textIndent: 6 },
                  ]}
                >
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
