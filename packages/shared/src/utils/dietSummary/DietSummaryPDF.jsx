import React from 'react';
import { Document, StyleSheet, View } from '@react-pdf/renderer';

import { Logo } from '../patientCertificates/Layout';
import { Footer } from '../patientCertificates/printComponents/Footer';
import { useLanguageContext, withLanguageContext } from '../pdf/languageContext';
import { useDateTime, withDateTimeContext } from '../pdf/withDateTimeContext';
import { Page } from '../pdf/Page';
import { Text, TextWithoutContext } from '../pdf/Text';
import { prepareDietSummary } from './prepareDietSummary';
import { GLOBAL_PDF_FONT, estimateWardPresence } from './estimateWardPresence';

const borderStyle = '1 solid black';

const NAME_WIDTH = 115;
const NHN_WIDTH = 60;
const BED_WIDTH = 35;
const PATIENT_COLUMNS_WIDTH = NAME_WIDTH + NHN_WIDTH + BED_WIDTH;
const CONTENT_WIDTH = 742;
const MAX_DIET_COLUMN_WIDTH = 34;
const HEADER_HEIGHT = 72;

const pageStyles = StyleSheet.create({
  body: {
    paddingHorizontal: 50,
    paddingTop: 30,
    paddingBottom: 50,
  },
});

const styles = StyleSheet.create({
  letterheadText: {
    width: '100%',
    maxWidth: 420,
    marginLeft: 'auto',
    marginRight: 0,
    textAlign: 'right',
    marginBottom: 16,
  },
  address: {
    fontSize: 9,
    fontWeight: 700,
    textAlign: 'right',
  },
  title: {
    fontSize: 13,
    fontWeight: 700,
    textAlign: 'right',
    marginTop: 6,
  },
  runningHead: {
    fontSize: 8,
    color: '#888888',
    textAlign: 'right',
    marginBottom: 10,
  },
  wardHeading: {
    fontSize: 9,
    marginBottom: 4,
  },
  table: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
    borderTop: borderStyle,
    borderRight: borderStyle,
    borderBottom: borderStyle,
    marginBottom: -1,
  },
  cell: {
    borderLeft: borderStyle,
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    minHeight: 17,
  },
  totalRow: {
    backgroundColor: '#f4f4f4',
  },
  cellText: {
    fontSize: 8,
  },
  totalText: {
    fontSize: 8,
  },
  countCell: {
    alignItems: 'center',
  },
  headerCell: {
    borderLeft: borderStyle,
    height: HEADER_HEIGHT,
    justifyContent: 'flex-end',
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  dietHeaderCell: {
    borderLeft: borderStyle,
    height: HEADER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dietHeaderText: {
    fontSize: 7,
    transform: 'rotate(-90deg)',
    width: HEADER_HEIGHT - 10,
  },
  // Drawn rather than typed: the standard PDF font the sheet falls back to has no tick glyph.
  tick: {
    width: 3.5,
    height: 7,
    borderRight: '1.2 solid black',
    borderBottom: '1.2 solid black',
    transform: 'rotate(45deg)',
    marginBottom: 2,
  },
  emptyState: {
    fontSize: 10,
    marginTop: 20,
  },
});

const getDietColumnWidth = (columnCount) => {
  if (columnCount === 0) return MAX_DIET_COLUMN_WIDTH;
  // Diet columns share whatever width the patient columns leave, so the sheet stays one page
  // wide however many diets there are.
  const available = (CONTENT_WIDTH - PATIENT_COLUMNS_WIDTH) / columnCount;
  return Math.min(MAX_DIET_COLUMN_WIDTH, available);
};

const Letterhead = ({ logoSrc, letterheadConfig, title }) => {
  const { title: facilityTitle, subTitle } = letterheadConfig ?? {};
  return (
    <>
      {logoSrc && <Logo logoSrc={logoSrc} />}
      <View style={styles.letterheadText}>
        <Text style={styles.address}>{facilityTitle}</Text>
        <Text style={styles.address}>{subTitle}</Text>
        <Text bold style={styles.title}>
          {title}
        </Text>
      </View>
    </>
  );
};

const RunningHead = ({ title }) => {
  const { makeIntlStyleSheet, pdfFont, pdfFontBold } = useLanguageContext();
  return (
    <View
      fixed
      render={({ pageNumber }) =>
        pageNumber > 1 && (
          <TextWithoutContext
            makeIntlStyleSheet={makeIntlStyleSheet}
            pdfFont={pdfFont}
            pdfFontBold={pdfFontBold}
            style={styles.runningHead}
          >
            {title}
          </TextWithoutContext>
        )
      }
    />
  );
};

const DietHeaderRowCells = ({ dietColumns, columnWidth }) => (
  <>
    {dietColumns.map(({ key, label }) => (
      <View key={key} style={[styles.dietHeaderCell, { width: columnWidth }]}>
        <Text style={styles.dietHeaderText}>{label}</Text>
      </View>
    ))}
  </>
);

// A diet id of `__proto__` or `constructor` is one the importer and the admin panel both accept,
// and the totals arrive as plain JSON however the server built them, so a ward with nobody on such
// a diet would read Object's own member here. React refuses that as a child and the whole sheet
// fails to render, where the worst a missing count should cost is a blank cell.
const countFor = (totals, key) => (Object.hasOwn(totals, key) ? totals[key] : 0);

const TotalCells = ({ dietColumns, columnWidth, totals }) => (
  <>
    {dietColumns.map(({ key }) => (
      <View key={key} style={[styles.cell, styles.countCell, { width: columnWidth }]}>
        <Text bold style={styles.totalText}>
          {countFor(totals, key) || ''}
        </Text>
      </View>
    ))}
  </>
);

const HospitalTotalTable = ({ dietColumns, columnWidth, hospitalTotals }) => {
  const { getTranslation } = useLanguageContext();
  return (
    <View style={styles.table}>
      <View style={styles.row} wrap={false}>
        <View style={[styles.dietHeaderCell, { width: PATIENT_COLUMNS_WIDTH }]} />
        <DietHeaderRowCells dietColumns={dietColumns} columnWidth={columnWidth} />
      </View>
      <View style={[styles.row, styles.totalRow]} wrap={false}>
        <View style={[styles.cell, { width: PATIENT_COLUMNS_WIDTH }]}>
          <Text bold style={styles.totalText}>
            {getTranslation('pdf.dietSummary.hospitalTotal', 'Hospital total')}
          </Text>
        </View>
        <TotalCells
          dietColumns={dietColumns}
          columnWidth={columnWidth}
          totals={hospitalTotals}
        />
      </View>
    </View>
  );
};

const PatientRow = ({ patient, dietColumns, columnWidth }) => (
  <View style={styles.row} wrap={false}>
    <View style={[styles.cell, { width: NAME_WIDTH }]}>
      <Text style={styles.cellText}>{`${patient.firstName} ${patient.lastName}`}</Text>
    </View>
    <View style={[styles.cell, { width: NHN_WIDTH }]}>
      <Text style={styles.cellText}>{patient.displayId}</Text>
    </View>
    <View style={[styles.cell, { width: BED_WIDTH }]}>
      <Text style={styles.cellText}>{patient.bed}</Text>
    </View>
    {dietColumns.map(({ key }) => (
      <View key={key} style={[styles.cell, styles.countCell, { width: columnWidth }]}>
        {patient.dietKeys.includes(key) && <View style={styles.tick} />}
      </View>
    ))}
  </View>
);

// Reads "{ward}" on the ward's first page, and "{ward} (continued)" on every page after, inside a
// `fixed` node that react-pdf repeats on every page its wrapping parent spans.
//
// react-pdf resolves a `fixed` dynamic node's `render` prop twice: `splitPage` calls it with only
// `pageNumber` while laying out, for every page a ward might still land on, then the final
// `resolvePageIndices` pass calls it again in page order with `subPageNumber` also set. Only that
// second pass should count as "the ward starts here", which is what the `subPageNumber` guard
// picks out — without it, the first (layout) pass would wrongly latch an earlier page as the
// ward's first page.
const WardHeading = ({ wardName }) => {
  const { getTranslation, makeIntlStyleSheet, pdfFont, pdfFontBold } = useLanguageContext();
  const continuedName = getTranslation('pdf.dietSummary.ward.continued', ':ward (continued)', {
    replacements: { ward: wardName },
  });

  let firstPageOfWard = Number.MAX_SAFE_INTEGER;

  return (
    <TextWithoutContext
      makeIntlStyleSheet={makeIntlStyleSheet}
      pdfFont={pdfFont}
      pdfFontBold={pdfFontBold}
      bold
      style={styles.wardHeading}
      render={({ pageNumber, subPageNumber }) => {
        if (pageNumber < firstPageOfWard && subPageNumber) {
          firstPageOfWard = pageNumber;
        }
        return pageNumber === firstPageOfWard ? wardName : continuedName;
      }}
    />
  );
};

// spec: DIETSUM#layout
const WardSection = ({ area, wardName, dietColumns, columnWidth }) => {
  const { getTranslation, pdfFont } = useLanguageContext();

  return (
    <>
      {/* react-pdf paints a `fixed` node on a page whatever else fits, so the heading block alone
          would be stranded at the foot of a page whose remaining space the Sub total row can't
          use. This spacer is an ordinary node, so react-pdf does honour its minPresenceAhead and
          carries the whole ward over instead. */}
      <View
        minPresenceAhead={estimateWardPresence(area, pdfFont === GLOBAL_PDF_FONT)}
        style={{ height: 14 }}
      />
      <View style={styles.table}>
        <View fixed>
          <WardHeading wardName={wardName} />
          <View style={styles.row}>
            <View style={[styles.headerCell, { width: NAME_WIDTH }]}>
              <Text style={styles.cellText}>
                {getTranslation('pdf.dietSummary.column.patientName', 'Patient name')}
              </Text>
            </View>
            <View style={[styles.headerCell, { width: NHN_WIDTH }]}>
              <Text style={styles.cellText}>
                {getTranslation('general.localisedField.displayId.label.short', 'NHN')}
              </Text>
            </View>
            <View style={[styles.headerCell, { width: BED_WIDTH }]}>
              <Text style={styles.cellText}>
                {getTranslation('pdf.dietSummary.column.bed', 'Bed')}
              </Text>
            </View>
            <DietHeaderRowCells dietColumns={dietColumns} columnWidth={columnWidth} />
          </View>
        </View>
        <View style={[styles.row, styles.totalRow]} wrap={false}>
          <View style={[styles.cell, { width: PATIENT_COLUMNS_WIDTH }]}>
            <Text bold style={styles.totalText}>
              {getTranslation('pdf.dietSummary.subTotal', 'Sub total')}
            </Text>
          </View>
          <TotalCells dietColumns={dietColumns} columnWidth={columnWidth} totals={area.subTotals} />
        </View>
        {area.patients.map((patient) => (
          <PatientRow
            key={patient.encounterId}
            patient={patient}
            dietColumns={dietColumns}
            columnWidth={columnWidth}
          />
        ))}
      </View>
    </>
  );
};

const DietSummaryPDFComponent = ({
  columns = [],
  hospitalTotals = {},
  areas = [],
  logoSrc,
  letterheadConfig,
  printedBy,
}) => {
  const { getTranslation } = useLanguageContext();
  const { formatShortest, getCurrentDate } = useDateTime();

  const title = `${getTranslation(
    'pdf.dietSummary.title',
    'Diet summary sheet',
  )} | ${formatShortest(getCurrentDate())}`;

  const { dietColumns, wardSections } = prepareDietSummary({ columns, areas, getTranslation });
  const columnWidth = getDietColumnWidth(dietColumns.length);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={pageStyles.body}>
        <RunningHead title={title} />
        <Letterhead logoSrc={logoSrc} letterheadConfig={letterheadConfig} title={title} />
        {areas.length === 0 ? (
          <Text style={styles.emptyState}>
            {getTranslation('pdf.dietSummary.noPatients', 'There are no patients to show.')}
          </Text>
        ) : (
          <>
            <HospitalTotalTable
              dietColumns={dietColumns}
              columnWidth={columnWidth}
              hospitalTotals={hospitalTotals}
            />
            {wardSections.map(({ area, wardName }) => (
              <WardSection
                key={area.id ?? 'no-area'}
                area={area}
                wardName={wardName}
                dietColumns={dietColumns}
                columnWidth={columnWidth}
              />
            ))}
          </>
        )}
        <Footer printedBy={printedBy} />
      </Page>
    </Document>
  );
};

export const DietSummaryPDF = withLanguageContext(withDateTimeContext(DietSummaryPDFComponent));
