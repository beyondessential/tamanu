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

const getHiddenRowDividerStyle = (index, rowCount) => {
  if (index === rowCount - 1) return { borderTopWidth: 0 };
  return { borderTopWidth: 0, borderBottomWidth: 0 };
};

const getSectionConfig = (index, data, getRowSectionLabel) => {
  const sectionLabel = getRowSectionLabel?.(data[index]);
  if (!sectionLabel) return { sectionLabel: null, shouldRenderSection: false };
  const lastSectionLabel = index > 0 ? getRowSectionLabel?.(data[index - 1]) : null;
  return { sectionLabel, shouldRenderSection: sectionLabel !== lastSectionLabel };
};

const TR = ({ style, ...props }) => <View {...props} style={[tableStyles.tr, style]} />;
const TH = ({ customStyles, ...props }) => (
  <Text bold {...props} style={[tableStyles.th, customStyles]} />
);
const TD = ({ customStyles, ...props }) => (
  <Text wrap={false} {...props} style={[tableStyles.td, customStyles]} />
);

// Keeps its own top border rather than borrowing the previous row's: with hideRowDividers the
// row above has no bottom border, so a section heading after one would otherwise float free of
// the rule above it. The shared -1 margin collapses it against a border that is there.
const SectionRow = ({ label, columnStyle }) => (
  <TR>
    <TD customStyles={[columnStyle, { borderLeft: basicBorder }]} bold>
      {label}
    </TD>
  </TR>
);

export const Table = ({
  data,
  columns,
  getSetting,
  formatters = {},
  columnStyle,
  headerStyle,
  hideRowDividers = false,
  getRowSectionLabel,
}) => {
  const visibleColumns = columns.filter(({ key }) => getSetting(`fields.${key}.hidden`) !== true);
  return (
    <View style={tableStyles.table}>
      {/* Fixed so it repeats when the table runs onto another page. A fixed row is exempt from
          pagination, so a table starting in a sliver at the page foot gets its header clipped —
          and its bottom border then lands across its own text. Where section rows supply that
          line themselves (they carry a top border), drop it here so a clip can't draw through. */}
      <TR fixed style={getRowSectionLabel ? { borderBottomWidth: 0 } : undefined}>
        {visibleColumns.map(({ title, key, customStyles }, index) => (
          <TH
            key={key}
            customStyles={[
              columnStyle,
              headerStyle,
              customStyles,
              index === 0 && { borderLeft: basicBorder },
            ]}
          >
            {title}
          </TH>
        ))}
      </TR>
      {data.map((row, rowIndex) => {
        const { sectionLabel, shouldRenderSection } = getSectionConfig(rowIndex, data, getRowSectionLabel);
        return (
          <React.Fragment key={rowIndex}>
            {shouldRenderSection && <SectionRow label={sectionLabel} columnStyle={columnStyle} />}
            <TR
              style={hideRowDividers && getHiddenRowDividerStyle(rowIndex, data.length)}
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
                    {accessor ? accessor(row, getSetting, formatters) : row[key]}
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
