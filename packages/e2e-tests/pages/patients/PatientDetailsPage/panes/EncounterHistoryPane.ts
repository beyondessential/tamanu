import { Locator, Page } from '@playwright/test';
import { getTableItems } from '@utils/testHelper';

export class EncounterHistoryPane {
  readonly page: Page;

  readonly contentPane!: Locator;
  readonly styledTableWrapper!: Locator;
  readonly heading!: Locator;
  readonly table!: Locator;
  readonly tableHead!: Locator;
  readonly dateSortLabel!: Locator;
  readonly encounterTypeSortLabel!: Locator;
  readonly facilityNameSortLabel!: Locator;
  readonly locationGroupNameSortLabel!: Locator;
  readonly reasonForEncounterLabel!: Locator;
  readonly emptyLabel!: Locator;
  readonly tableBody!: Locator;
  readonly dateCell!: Locator;
  readonly dateWrapper!: Locator;
  readonly statusIndicator!: Locator;
  readonly tooltip!: Locator;
  readonly encounterTypeCell!: Locator;
  readonly facilityNameCell!: Locator;
  readonly limitedLinesCellWrapper!: Locator;
  readonly facilityWrapper!: Locator;
  readonly locationGroupNameCell!: Locator;
  readonly reasonForEncounterCell!: Locator;
  readonly reasonForEncounterWrapper!: Locator;
  readonly emptyCell!: Locator;
  readonly menuContainer!: Locator;
  readonly openButton!: Locator;
  readonly icon!: Locator;
  readonly tableFooter!: Locator;
  readonly tableRow!: Locator;
  readonly tableCell!: Locator;
  readonly styledIconButton!: Locator;
  readonly getAppIcon!: Locator;
  readonly paginatorWrapper!: Locator;
  readonly footerContent!: Locator;
  readonly pageRecordCount!: Locator;
  readonly styledSelectField!: Locator;
  readonly styledPagination!: Locator;
  readonly paginationItem!: Locator;
  constructor(page: Page) {
    this.page = page;

    const testIds = {
      contentPane: 'contentpane-n51k',
      styledTableWrapper: 'styledtable-6fdu',
      heading: 'heading4-ssa1',
      table: 'styledtable-1dlu',
      tableHead: 'styledtablehead-ays3',
      dateSortLabel: 'tablesortlabel-0qxx-startDate',
      encounterTypeSortLabel: 'tablesortlabel-0qxx-encounterType',
      facilityNameSortLabel: 'tablesortlabel-0qxx-facilityName',
      locationGroupNameSortLabel: 'tablesortlabel-0qxx-locationGroupName',
      reasonForEncounterLabel: 'tablelabel-0eff-reasonForEncounter',
      emptyLabel: 'tablelabel-0eff-',
      tableBody: 'styledtablebody-a0jz',
      dateCell: 'styledtablecell-2gyy-0-startDate',
      dateWrapper: 'datewrapper-5lb0',
      statusIndicator: 'statusindicator-c389',
      tooltip: 'tooltip-b4e8',
      encounterTypeCell: 'styledtablecell-2gyy-0-encounterType',
      facilityNameCell: 'styledtablecell-2gyy-0-facilityName',
      limitedLinesCellWrapper: 'limitedlinescellwrapper-imvw',
      facilityWrapper: 'facilitywrapper-s4m4',
      locationGroupNameCell: 'styledtablecell-2gyy-0-locationGroupName',
      reasonForEncounterCell: 'styledtablecell-2gyy-0-reasonForEncounter',
      reasonForEncounterWrapper: 'reasonforencounterwrapper-7vsk',
      emptyCell: 'styledtablecell-2gyy-0-',
      menuContainer: 'menucontainer-ox22',
      openButton: 'openbutton-d1ec',
      icon: 'icon-p0po',
      tableFooter: 'styledtablefooter-7pgn',
      tableRow: 'styledtablerow-oomc',
      tableCell: 'tablecell-zqda',
      styledIconButton: 'stylediconbutton-bjog',
      getAppIcon: 'getappicon-ccvs',
      paginatorWrapper: 'paginatorwrapper-l9c5',
      footerContent: 'footercontent-yb09',
      pageRecordCount: 'pagerecordcount-m8ne',
      styledSelectField: 'styledselectfield-lunn',
      styledPagination: 'styledpagination-fbr1',
      paginationItem: 'paginationitem-hcui',
    } as const;

    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }
  }
  async getLatestEncounter(): Promise<Locator> {
    return this.tableBody.locator('tr').first();
  }
  async getLatestEncounterValues(): Promise<Record<string, string>> {
    const encounterValues: Record<string, string> = {};
    // Normalize the start date to remove non-breaking spaces and multiple spaces
    const normalizedStartDate = (await getTableItems(this.page, 1, 'startDate'))[0]
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
    encounterValues.startDate = normalizedStartDate;
    encounterValues.encounterType = (await getTableItems(this.page, 1, 'encounterType'))[0];
    encounterValues.facilityName = (await getTableItems(this.page, 1, 'facilityName'))[0];
    encounterValues.area = (await getTableItems(this.page, 1, 'locationGroupName'))[0];
    encounterValues.reasonForEncounter = (await getTableItems(this.page, 1, 'reasonForEncounter'))[0];
    return encounterValues;
  }


}
