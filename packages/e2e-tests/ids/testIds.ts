/**
 * Centralized registry of all hashed data-testid values from the Tamanu app.
 * When the app changes an ID, update it here — all page objects reference this file.
 */

// ---------------------------------------------------------------------------
// Dynamic ID builders
// ---------------------------------------------------------------------------

/** Table cell: `styledtablecell-2gyy-{row}-{column}` */
export function tableCell(row: number, column: string): string {
  return `${TABLE_CELL_PREFIX}${row}-${column}`;
}

/** Table sort label: `tablesortlabel-0qxx-{column}` */
export function tableSortLabel(column: string): string {
  return `${ids.table.sortPrefix}${column}`;
}

/** Recently viewed patient card field at index */
export function recentCard(field: 'title' | 'text' | 'capitalizedText' | 'subtext' | 'date', index: number): string {
  const map = { title: 'cardtitle-qqhk', text: 'cardtext-iro1', capitalizedText: 'capitalizedcardtext-zu58', subtext: 'cardtext-i2bu', date: 'datedisplay-tw5s' };
  return `${map[field]}-${index}`;
}

export const TABLE_CELL_PREFIX = 'styledtablecell-2gyy-';

// ---------------------------------------------------------------------------
// Static IDs organized by domain
// ---------------------------------------------------------------------------

export const ids = {
  // -- Login --
  login: {
    button: 'loginbutton-gx21',
    emailInput: 'styledfield-dwnl-input',
    passwordInput: 'styledfield-a9k6-input',
  },

  // -- Sidebar --
  sidebar: {
    userAndFacilityName: 'connectedto-6awb',
    logoutButton: 'logoutbutton-4zn4',
  },

  // -- Shared table elements --
  table: {
    container: 'styledtablecontainer-3ttp',
    table: 'styledtable-1dlu',
    head: 'styledtablehead-ays3',
    body: 'styledtablebody-a0jz',
    footer: 'styledtablefooter-0eff',
    footerAlt: 'styledtablefooter-7pgn',
    statusCell: 'statustablecell-rwkq',
    pagination: 'styledpagination-fbr1',
    pageRecordCount: 'pagerecordcount-m8ne',
    recordCountDropdown: 'styledselectfield-lunn',
    prevPage: 'paginationitem-hcui',
    nextPage: 'paginationitem-d791',
    pageButtons: 'paginationitem-c5vg',
    sortPrefix: 'tablesortlabel-0qxx-',
    downloadButton: 'download-data-button',
    downloadButtonAlt: 'downloadbutton-0eff',
    menuItem: 'styledmenuitem-fkrw-undefined',
  },

  // -- Patient search (shared across list pages) --
  patientSearch: {
    title: 'searchtabletitle-09n6',
    form: 'styledform-5o5i',
    nhnInput: 'localisedfield-4cb5-input',
    firstNameInput: 'localisedfield-0m33-input',
    lastNameInput: 'localisedfield-26d7-input',
    advancedSearchToggle: 'iconbutton-zrkv',
    searchButton: 'searchbutton-nt24',
    clearButton: 'clearbutton-z9x3',
  },

  // -- All Patients page --
  allPatients: {
    newPatientButton: 'component-enxe',
    newPatientFirstName: 'localisedfield-cqua-input',
    newPatientLastName: 'localisedfield-41un-input',
    newPatientDob: 'localisedfield-oafl-input',
    newPatientMale: 'controllabel-kkx2-male',
    newPatientFemale: 'controllabel-kkx2-female',
    newPatientId: 'id-8niy',
    newPatientSubmit: 'formsubmitbutton-ygc6',
    nhnSearchInput: 'localisedfield-dzml-input',
    firstNameSearchInput: 'localisedfield-i9br-input',
    lastNameSearchInput: 'localisedfield-ngsn-input',
    dobField: 'field-qk60',
    culturalNameInput: 'localisedfield-epbq-input',
    villageInput: 'villagelocalisedfield-mcri-input',
    newPatientVillageInput: 'localisedfield-rpma-input',
    deceasedCheckbox: 'field-ngy7-controlcheck',
    villageSuggestionList: 'villagelocalisedfield-mcri-suggestionslist',
    sexDropdownIcon: 'sexlocalisedfield-7lm9-expandmoreicon-h115',
    sexDropdownClear: 'stylediconbutton-6vh3',
    dobFromField: 'joinedfield-swzm',
    dobToField: 'field-aax5',
    twoColumnsField: 'twocolumnsfield-wg4x',
    searchResultsPagination: 'pagerecordcount-m8ne',
  },

  // -- Inpatients page --
  inpatients: {
    title: 'searchtabletitle-v9md',
    nhnInput: 'localisedfield-p72m-input',
    firstNameInput: 'localisedfield-50wl-input',
    lastNameInput: 'localisedfield-8w55-input',
    departmentInput: 'localisedfield-gzn5-input',
  },

  // -- Outpatients page --
  outpatients: {
    nhnInput: 'localisedfield-p72m-input',
    firstNameInput: 'localisedfield-50wl-input',
    lastNameInput: 'localisedfield-8w55-input',
  },

  // -- Emergency patients page --
  emergency: {
    container: 'pagecontainer-mjc9',
    appBar: 'appbar-eplg',
    heading: 'topbarheading-bgnl',
    statsContainer: 'statisticscardcontainer-4vpu',
  },

  // -- Recently viewed patients --
  recentlyViewed: {
    navigateNext: 'navigatenext-zeo2',
  },

  // -- Patient details page --
  patientDetails: {
    healthIdText: 'healthidtext-fqvn',
    prepareDischargeButton: 'component-enxe',
    arrowDownMenu: 'menubutton-dc8o',
    threeDotMenu: 'stylediconbutton-szh8',
    editEncounterItem: 'menuitem-0',
    addDiagnosisButton: 'adddiagnosisbutton-2ij9',
    diagnosisList: 'diagnosislistcontainer-dqkk',
    diagnosisCategory: 'category-vwwx',
    diagnosisName: 'diagnosisname-vvn4',

    // Tabs
    vaccineTab: 'tab-vaccines',
    procedureTab: 'styledtab-ccs8-procedures',
    labsTab: 'styledtab-ccs8-labs',
    notesTab: 'styledtab-ccs8-notes',
    vitalsTab: 'styledtab-ccs8-vitals',
    imagingTab: 'styledtab-ccs8-imaging',
    documentsTab: 'tab-documents',
    tasksTab: 'styledtab-ccs8-tasks',
    chartsTab: 'styledtab-ccs8-charts',
    referralsTab: 'tab-referrals',
    medicationTab: 'styledtab-ccs8-medication',
    detailsTab: 'tab-details',

    // Sidebar lists
    listsSection: 'listssection-1frw',
    addButton: 'addbutton-b0ln',
    collapseSection: 'collapse-0a33',
    formGrid: 'formgrid-lqds',

    // Ongoing conditions
    ongoingConditionName: 'field-j30y-input',
    ongoingConditionDate: 'field-2775',
    ongoingConditionClinician: 'field-9miu-input',
    ongoingConditionNotes: 'field-e52k-input',
    ongoingConditionNameWrapper: 'field-j30y-input-outerlabelfieldwrapper',
    ongoingConditionSubmit: 'formsubmitcancelrow-2r80-confirmButton',
    savedOngoingName: 'typography-qxy3',

    // Allergies
    allergyName: 'field-hwfk-input',
    allergyDate: 'field-gmf8',
    allergySubmit: 'formsubmitcancelrow-nx2z-confirmButton',

    // Family history
    familyHistoryDiagnosis: 'field-3b4u-input',
    familyHistoryDate: 'field-wrp3',
    familyHistoryRelationship: 'field-t0k5-input',
    familyHistoryClinician: 'field-kbwi-input',
    familyHistoryNotes: 'field-mgiu-input',
    familyHistorySubmit: 'formsubmitcancelrow-rz1i-confirmButton',

    // Other issues
    otherIssuesNote: 'field-nj3s-input',
    otherIssuesDate: 'field-urg2',
    otherIssuesSubmit: 'formsubmitcancelrow-x2a0-confirmButton',

    // Warning modal
    warningTitle: 'modaltitle-ojhf',
    warningContent: 'modalcontent-bk4w',
    warningCancel: 'button-ui1m',
    warningProceed: 'button-3i9s',

    // Care plan
    carePlanNameField: 'field-uc7w-input',
    carePlanDateField: 'field-764k',
    carePlanClinicianField: 'field-kb54-input',
    carePlanNotesField: 'field-0yjf-input',
    carePlanSubmit: 'formsubmitcancelrow-s3rl-confirmButton',
    carePlanEditSubmit: 'formsubmitcancelrow-2egx-confirmButton',
    carePlanNoteContainer: 'notecontainer-6fi4',
    carePlanEditNoteField: 'field-hh8q-input',
    carePlanEditNoteContent: 'field-qouz',
    carePlanItemExpand: 'openbutton-d1ec',
    carePlanItem0: 'item-8ybn-0',
    carePlanItem1: 'item-8ybn-1',
    carePlanEditContainer: 'editablenoteformcontainer-mx3i',
    carePlanDeleteCheckbox: 'field-c7nr-controlcheck',
    carePlanDateRecordedField: 'field-4g2s-input',
    carePlanDischargeCondition: 'field-e8ln-input',
  },

  // -- Patient details tab (demographics) --
  detailsTab: {
    contentPane: 'contentpane-p0hd',
    form: 'styledform-5o5i',
    headingDetails: 'patientdetailsheading-3ftw',
    headingSecondary: 'patientdetailsheading-hkyy',
    headingBirth: 'patientdetailsheading-pipb',
    headingIdentification: 'patientdetailsheading-vd0y',
    headingAdditional: 'patientdetailsheading-ccov',
    maleRadio: 'radio-il3t-male',
    femaleRadio: 'radio-il3t-female',
    submitButton: 'formsubmitbutton-dzgy',
    secondaryGrid: 'secondarydetailsformgrid-qrkb',
  },

  // -- Encounter history --
  encounterHistory: {
    contentPane: 'contentpane-n51k',
    summaryTable: 'styledtable-6fdu',
    heading: 'heading4-ssa1',
    firstRowDate: 'styledtablecell-2gyy-0-startDate',
    dateWrapper: 'datewrapper-5lb0',
    statusIndicator: 'statusindicator-c389',
    firstRowType: 'styledtablecell-2gyy-0-encounterType',
    firstRowFacility: 'styledtablecell-2gyy-0-facilityName',
    facilityWrapper: 'facilitywrapper-s4m4',
    firstRowLocation: 'styledtablecell-2gyy-0-locationGroupName',
    firstRowReason: 'styledtablecell-2gyy-0-reasonForEncounter',
    reasonWrapper: 'reasonforencounterwrapper-7vsk',
    menuContainer: 'menucontainer-ox22',
    openButton: 'openbutton-d1ec',
  },

  // -- Change encounter details menu --
  encounterMenu: {
    paper: 'paper-0i9j',
    menuList: 'menulist-sze7',
    item0: 'menuitem-0qdd-0',
    item1: 'menuitem-0qdd-1',
    item2: 'menuitem-0qdd-2',
    item3: 'menuitem-0qdd-3',
    item4: 'menuitem-0qdd-4',
    item5: 'menuitem-0qdd-5',
  },

  // -- Hospital admission modal --
  hospitalAdmission: {
    container: 'modalcontainer-uc2n',
    content: 'modalcontent-bk4w',
    form: 'styledform-5o5i',
    formGrid: 'formgrid-ima9',
    departmentInput: 'field-t9el-input',
    supervisingInput: 'field-vol8-input',
    reasonInput: 'field-gfz3-input',
    referralInput: 'field-o6eb-input',
    locationGroupInput: 'field-25q3-group-input',
    locationInput: 'field-25q3-location-input',
    billingTypeInput: 'localisedfield-3vac-input',
    dietSelect: 'multiselectinput-vf2i',
    practitionerInput: 'field-o5gm-input',
    submitButton: 'formsubmitbutton-4ker',
    actions: 'dialogactions-jkc6',
    title: 'modaltitle-ojhf',
    prioritySelect: 'selectinput-phtg-select',
  },

  // -- Emergency triage modal --
  emergencyTriage: {
    header: 'verticalcenteredtext-ni4s',
    closeButton: 'iconbutton-eull',
    patientDetails: 'patientdetails-pdbh',
    form: 'styledform-5o5i',
    arrivalModeField: 'field-mhav',
    triageCodeField: 'field-9hxy',
    locationGroupInput: 'field-ipih-group-input',
    locationInput: 'field-ipih-location-input',
    prioritySelect: 'selectinput-phtg-select',
    chiefComplaintInput: 'field-a7cu-input',
    practitionerInput: 'field-1ktz-input',
    vitalSignsButton: 'outlinedbutton-pp8c',
    injuryInput: 'field-388u-input',
    cancelButton: 'outlinedbutton-8rnr',
    confirmButton: 'row-vpng-confirmButton',
  },

  // -- Create encounter modal --
  createEncounter: {
    typeButton: 'encounteroptiontypebutton-haqi',
  },

  // -- Prepare discharge modal --
  prepareDischarge: {
    dischargeClinicianInput: 'field-0uma-input',
    dischargeContent: 'box-p5wr',
    cancelButton: 'outlinedbutton-8rnr',
  },

  // -- Diagnosis modal --
  diagnosis: {
    closeIcon: 'closeicon-z1u6',
    diagnosisInput: 'field-f5vm-input',
    primaryCheckbox: 'field-52wo-controlcheck',
    certaintySelect: 'field-a9rl-select',
    dateField: 'field-fszu',
    cancelButton: 'outlinedbutton-8rnr',
    confirmButton: 'formsubmitcancelrow-jfcw-confirmButton',
    clinicianInput: 'field-af83-input',
  },

  // -- Change location modal --
  changeLocation: {
    groupInput: 'field-tykg-group-input',
    locationInput: 'field-tykg-location-input',
    cancelButton: 'outlinedbutton-8rnr',
    confirmButton: 'formsubmitcancelrow-35ou-confirmButton',
    locationOption: 'field-tykg-location-option-typography',
  },

  // -- Change diet modal --
  changeDiet: {
    confirmButton: 'confirmbutton-tok1',
    cancelButton: 'outlinedbutton-95wy',
    title: 'modaltitle-ojhf',
    formGrid: 'formgrid-r4hj',
    dietSelect: 'multiselectinput-vf2i',
  },

  // -- Lab request pane --
  labPane: {
    newRequestButton: 'component-enxe',
    sortByCategory: 'tablesortlabel-0qxx-category.name',
  },

  // -- Lab request modal (new request) --
  labModal: {
    form: 'styledform-5o5i',
    heading: 'heading3-keat',
    description: 'styledbodytext-8egc',
    requestingClinicianInput: 'field-z6gb-input',
    requestDateTimeField: 'field-y6ku',
    departmentInput: 'field-wobc-input',
    prioritySelect: 'selectinput-phtg-select',
    panelRadio: 'radio-il3t-panel',
    individualRadio: 'radio-il3t-individual',
    backButton: 'styledbackbutton-016f',
    formGrid: 'formgrid-wses',
    nextButton: 'formsubmitcancelrow-aaiz-confirmButton',
    selectedItems: 'testitemwrapper-o7ha',
    selectorTable: 'selectortable-dwrp',
    clearAllButton: 'clearallbutton-ao0r',
    validationError: 'formhelpertext-198r',
    searchInput: 'styledsearchfield-92y3-input',
    notesInput: 'field-3t0x-input',
    labelText: 'labeltext-6stl',
    categoryText: 'categorytext-jno3',

    // Sample details
    dateTimeCollectedInputs: 'styledfield-ratc-input',
    collectedByInputs: 'styledfield-wifm-input',
    collectedBySuggestions: 'styledfield-wifm-suggestionslist',
    specimenTypeInputs: 'styledfield-8g4b-input',
    specimenTypeSuggestions: 'styledfield-8g4b-suggestionslist',
    siteInputs: 'styledfield-mog8-input',
    siteOptionText: 'styledfield-mog8-option-typography',

    // Summary/review
    requestingClinicianLabel: 'cardlabel-6kys',
    requestingClinicianValue: 'cardvalue-lcni',
    selectAllCheckbox: 'checkinput-irky-controlcheck',
    labRequestIdLabel: 'tablelabel-0eff-displayId',
    selectRowCheckbox: 'checkinput-83pj-controlcheck',

    // Final step
    cancelButton: 'outlinedbutton-8rnr',
    closeButton: 'outlinedbutton-skm0',
    finaliseButton: 'outlinedbutton-01eu',
    printButton: 'button-9vga',
  },

  // -- Panel lab request sub-modal --
  labPanel: {
    panelSelector: 'selectortable-dwrp',
    testSelector: 'selectortable-6eaw',
    selectedPanelsList: 'testitemwrapper-o7ha',
    searchInput: 'field-3t0x-input',
  },

  // -- Individual lab request sub-modal --
  labIndividual: {
    searchInput: 'styledsearchfield-92y3-input',
    checkbox: 'styledcheckboxcontrol-6oiy',
    selectorContainer: 'selectorcontainer-gewc',
    testSelector: 'selectortable-6eaw',
    notesInput: 'field-3t0x-input',
    dateTimeCollected: 'styledfield-ratc-input',
    collectedByInput: 'styledfield-wifm-input',
    collectedByExpand: 'styledfield-wifm-input-expandmoreicon',
    specimenTypeInput: 'styledfield-8g4b-input',
    specimenTypeExpand: 'styledfield-8g4b-input-expandmoreicon',
    siteInput: 'styledfield-mog8-input',
    siteExpand: 'styledfield-mog8-input-expandmoreicon',
  },

  // -- Lab request details page --
  labDetails: {
    container: 'container-pag3',
    tileRow: 'fixedtilerow-xxmq',
    tileContainer: 'container-uk3i',
    tileMain: 'main-vs6r',
    tileTag: 'tiletag-zdg8',
    sampleCollectedDate: 'datedisplay-h6el',
    backButton: 'backbutton-1n40',
    statusLogButton: 'item-8ybn-1',
    expandButton: 'openbutton-d1ec',
    resultText: 'text-u1af',
    header: 'header-7mhd',
    cancelItem: 'item-8ybn-0',
    changeLaboratoryButton: 'button-oep6',
  },

  // -- Record sample modal --
  recordSample: {
    form: 'formgrid-3btd',
    dateTimeInput: 'styledfield-dmjl-input',
    collectedByInput: 'styledfield-v88m-input',
    collectedByExpand: 'styledfield-v88m-input-expandmoreicon',
    specimenTypeInput: 'styledfield-0950-input',
    specimenTypeExpand: 'styledfield-0950-input-expandmoreicon',
    siteDropdownIcon: 'selectinput-phtg-expandmoreicon-h115',
    confirmButton: 'row-vpng-confirmButton',
    closeButton: 'close-button',
    cancelButton: 'cancel-button',
  },

  // -- Change laboratory modal --
  changeLab: {
    form: 'formgrid-3btd',
    laboratoryInput: 'field-36s0-input',
    confirmButton: 'row-vpng-confirmButton',
    cancelButton: 'outlinedbutton-8rnr',
  },

  // -- Change priority modal --
  changePriority: {
    form: 'formgrid-3btd',
    priorityInput: 'autocompleteinput-lob3-input',
    confirmButton: 'confirmbutton-tok1',
    cancelButton: 'outlinedbutton-95wy',
  },

  // -- Status log modal --
  statusLog: {
    content: 'modalcontent-bk4w',
  },

  // -- Enter results modal --
  enterResults: {
    container: 'modalcontainer-uc2n',
    form: 'styledform-5o5i',
    confirmButton: 'confirmbutton-tok1',
    testTypeHeader: 'styledtableheadercell-wvus-labTestType',
    dataCellPrefix: 'styledtabledatacell-bsji',
    methodExpandIcon: 'styledfield-h653-expandmoreicon-h115',
    methodOption: 'styledfield-h653-option',
    labTestMethodSelect: 'selectinput-phtg-select',
    labTestMethodExpand: 'selectinput-phtg-expandmoreicon-h115',
    labTestMethodOption: 'selectinput-phtg-option',
  },

  // -- Imaging request pane --
  imagingPane: {
    newButton: 'button-21bg',
    recordButton: 'component-enxe',
  },

  // -- New imaging request modal --
  imagingModal: {
    codeInput: 'field-6jew-input',
    orderDateTimeField: 'field-xsta',
    supervisingInput: 'textinput-3wnq-input',
    requestingClinicianInput: 'field-g6kl-input',
    requestingClinicianClear: 'field-g6kl-input-clearbutton',
    requestingClinicianExpand: 'field-g6kl-input-expandmoreicon',
    imagingTypeSelect: 'field-xemr-select',
    areaInput: 'textinput-tyem-input',
    prioritySelect: 'field-khld-select',
    noteInput: 'field-hhqc-input',
    cancelButton: 'outlinedbutton-8rnr',
    submitMenu: 'menubutton-dc8o',
    formGrid: 'formgrid-4uzw',
    submitButton: 'mainbuttoncomponent-06gp',
    areasMultiSelect: 'multiselectinput-dvij',
  },

  // -- Notes pane --
  notesPane: {
    tab: 'styledtab-ccs8-notes',
    noteTypeFilter: 'styledtranslatedselectfield-oy9y-input-outerlabelfieldwrapper',
    noteTypeSuggestions: 'styledtranslatedselectfield-oy9y-suggestionslist',
    readMore: 'readmorespan-dpwv',
    showLess: 'showlessspan-7kuw',
    editIcon: 'styledediticon-nmdz',
    editedButton: 'editedbutton-jn5i',
    dataTable: 'datafetchingtable-qdej',
    noDataMessage: 'nodatamessage-78ud',
    noteRow: 'row-v55c',
    noteHeader: 'noteheadertext-e3kq',
    noteContent: 'notecontentcontainer-cgxg',
  },

  // -- Note modal (new/edit) --
  noteModal: {
    confirmButton: 'formsubmitcancelrow-confirmButton',
    writtenByInput: 'field-ar9q-input',
    dateTimeField: 'field-nwwl',
    contentTextarea: 'field-wxzr',
    cancelButton: 'outlinedbutton-8rnr',
    noteTypeSelect: 'field-a0mv-select',
    noteTypeError: 'field-a0mv-formhelptertext',
  },

  // -- Treatment plan note modal --
  treatmentPlanModal: {
    writtenByInput: 'field-ar9q-input',
    writtenBySuggestions: 'field-ar9q-suggestionslist',
  },

  // -- Discard note modal --
  discardNote: {
    cancelButton: 'outlinedbutton-p957',
    confirmButton: 'confirmbutton-y3tb',
  },

  // -- Changelog modal --
  changelog: {
    closeButton: 'iconbutton-eull',
    infoWrapper: 'stylednotechangeloginfowrapper-zbh3',
    cardBody: 'cardbody-3iyj',
    cardCell: 'cardcell-8efu',
    cardValue: 'cardvalue-lcni',
    dateDisplay: 'datedisplay-o9yj',
    headerDate: 'datedisplay-cfwj',
    labelKey: 'cardlabel-6kys',
  },

  // -- Vitals modal --
  vitalsModal: {
    header: 'verticalcenteredtext-ni4s',
    closeButton: 'iconbutton-eull',
    confirmButton: 'formsubmitcancelrow-vzf5-confirmButton',
  },

  // -- Charts pane --
  chartsPane: {
    chartTypeSelect: 'styledtranslatedselectfield-vwze-select',
    chartTypeOptions: 'styledtranslatedselectfield-vwze-optioncontainer',
    recordButtonRow: 'tablebuttonrowwrapper-srjx',
  },

  // -- Simple chart modal --
  chartModal: {
    form: 'styledform-5o5i',
    confirmButton: 'formsubmitcancelrow-1ah9-confirmButton',
    cancelButton: 'outlinedbutton-8rnr',
  },

  // -- Procedure pane --
  procedurePane: {
    tabPane: 'tabpane-q1xp',
  },

  // -- New procedure modal --
  procedureModal: {
    procedureInput: 'field-87c2-input',
    procedureDateInput: 'field-3a5v',
    procedureAreaInput: 'field-p4ef-group-input',
    procedureLocationInput: 'field-p4ef-location-input',
    leadClinicianInput: 'field-lit6-input',
    departmentInput: 'field-3a5v1-input',
    anaesthetistInput: 'field-96eg-input',
    assistantAnaesthetistInput: 'field-96eg1-input',
    anaestheticTypeInput: 'field-w9b5-input',
    timeInInput: 'field-khml1',
    timeOutInput: 'field-hgzz1',
    timeStartedInput: 'field-khml',
    timeEndedInput: 'field-hgzz',
    notesInput: 'field-7en7-input',
    completedNotesInput: 'field-qrv7-input',
    completedCheckbox: 'field-uaz4-controlcheck',
    completedNotesCollapse: 'collapse-e9ow',
    actions: 'dialogactions-jkc6',
    modalHeader: 'verticalcenteredtext-ni4s',
    title: 'modaltitle-ojhf',
    assistantCliniciansInput: 'styledformcontrol-td30',
  },

  // -- Unsaved changes modal --
  unsavedChanges: {
    title: 'modaltitle-ojhf',
    closeButton: 'iconbutton-eull',
    discardButton: 'confirmbutton-y3tb',
    continueButton: 'outlinedbutton-p957',
    content: 'modalcontent-bk4w',
  },

  // -- Tasks pane --
  tasksPane: {
    addButton: 'button-a1te',
    table: 'taskstable-cv6v',
    highPriorityIcon: 'styledpriorityhighicon-7slu',
    completeIcon: 'styledcheckcircleicon-31o6',
    completeCheckbox: 'styledcheckinput-kqdn-controlcheck',
    cancelIcon: 'styledcancelicon-nzdl',
    notCompleteCheckbox: 'styledcheckinput-vgby-controlcheck',
    deleteIcon: 'styleddeleteoutlineicon-w3ya',
    noDataContainer: 'nodatacontainer-476e',
  },

  // -- Add task modal --
  addTask: {
    nameField: 'field-om46',
    dueDateField: 'field-yduo',
    requestedByInput: 'field-xhot-input',
    dueTimeField: 'field-e475',
    descriptionInput: 'field-hp09-input',
    frequencyField: 'field-7vdy',
    prioritySelect: 'field-tadr-select',
    designationSelect: 'field-qy5a-select',
    highPriorityCheck: 'styledcheckfield-qicr-controlcheck',
    assigneeSelect: 'multiselectinput-vf2i',
    confirmButton: 'formsubmitcancelrow-jcmz-confirmButton',
    cancelButton: 'outlinedbutton-8rnr',
  },

  // -- Mark task completed modal --
  markCompleted: {
    completedByInput: 'field-4r4u-input',
    completedDateField: 'field-el3t',
    notesInput: 'field-kvze-input',
    confirmButton: 'formsubmitcancelrow-v41o-confirmButton',
    cancelButton: 'outlinedbutton-8rnr',
  },

  // -- Mark task not completed modal --
  markNotCompleted: {
    notCompletedByInput: 'field-maud-input',
    dateField: 'field-sgto',
    reasonInput: 'field-r3a1-input',
    confirmButton: 'formsubmitcancelrow-y08n-confirmButton',
    cancelButton: 'outlinedbutton-8rnr',
  },

  // -- Delete task modal --
  deleteTask: {
    deletedByInput: 'field-2l6f-input',
    dateField: 'field-bnve',
    reasonInput: 'field-4x58-input',
    confirmButton: 'formsubmitcancelrow-0v1x-confirmButton',
    cancelButton: 'outlinedbutton-8rnr',
  },

  // -- Medications pane --
  medicationsPane: {
    tabPane: 'tabpane-u787',
    buttonRow: 'tablebuttonrow-dl51',
    newMedicationButton: 'styledtextbutton-hbja',
    allMedicationsButton: 'styledtextbutton-uhgj',
    recordButton: 'component-enxe',
  },

  // -- Documents pane --
  documentsPane: {
    addButton: 'component-enxe',
  },

  // -- Add document modal --
  addDocument: {
    header: 'verticalcenteredtext-ni4s',
    fileInput: 'input-q5no',
    nameInput: 'field-b9rq-input',
    typeInput: 'field-yn8l-input',
    departmentInput: 'field-sy66-input',
    noteInput: 'field-ynp5-input',
    confirmButton: 'formsubmitcancelrow-me5l-confirmButton',
  },

  // -- Referrals pane --
  referralsPane: {
    addButton: 'button-u28m',
  },

  // -- Add referral modal --
  addReferral: {
    surveyRow: 'row-atzb',
    startButton: 'button-qsbg',
    formGrid: 'formgrid-prtu',
    referralTypeSelect: 'selectinput-4g3c-select',
    surveyFormGrid: 'formgrid-h378',
    referredToInput: 'wrapperfieldcomponent-mkjr-input',
    referredByInput: 'autocompletefield-efuf-input',
    referralReasonInput: 'selectinput-ra3s-input',
    addButton: 'button-m3a6',
    submitButton: 'formsubmitbutton-pufy',
  },

  // -- Vaccine pane --
  vaccinePane: {
    recordButton: 'component-enxe',
    pageRecordCount: 'pagerecordcount-m8ne',
    table: 'immunisationstable-q9jd',
    tableWrapper: 'tablewrapper-rbs7',
    notGivenCheckbox: 'notgivencheckbox-mz3p-controlcheck',
    sortByVaccine: 'tablesortlabel-0qxx-vaccineDisplayName',
    sortByDate: 'tablesortlabel-0qxx-date',
    expandButton: 'openbutton-d1ec',
    vaccineRowPrefix: 'styledtablecell-2gyy-',
  },

  // -- Record vaccine modal --
  recordVaccine: {
    dateField: 'field-rd4e',
    scheduleSelect: 'field-npct-select',
    consentCheckbox: 'consentfield-rvwt-controlcheck',
    confirmButton: 'formsubmitcancelrow-vv8q-confirmButton',
    givenTab: 'styledtab-gibh-GIVEN',
    notGivenTab: 'styledtab-gibh-NOT_GIVEN',
    batchInput: 'field-xycc-input',
    routineRadio: 'controllabel-kkx2-Routine',
    catchupRadio: 'controllabel-kkx2-Catchup',
    campaignRadio: 'controllabel-kkx2-Campaign',
    otherRadio: 'controllabel-kkx2-Other',
    categoryGroup: 'field-rggk-styledradiogroup',
    locationGroupInput: 'field-zrlv-group-input',
    locationInput: 'field-zrlv-location-input',
    givenByInput: 'field-5sfc-input',
    vaccineNameInput: 'field-vaccineName-input',
    vaccineBrandInput: 'field-865y-input',
    diseaseSelect: 'field-jz48-select',
    injectionSiteInput: 'field-inc8-input',
    countryField: 'field-8sou',
    areaSelect: 'selectinput-phtg-select',
    recordedByInput: 'field-f1vm-input',
    supervisingInput: 'field-gcfk-input',
    locationGroupWrapper: 'field-zrlv-group-input-outerlabelfieldwrapper',
    locationWrapper: 'field-zrlv-location-input-outerlabelfieldwrapper',
    givenByWrapper: 'field-5sfc-input-outerlabelfieldwrapper',
    dateError: 'formhelpertext-sz5u',
    generalError: 'formhelpertext-2d0o',
    scheduleError: 'field-npct-formhelptertext',
    givenElsewhereCheckbox: 'field-w50x-controlcheck',
    fullWidthCol: 'fullwidthcol-lan5',
    indicator: 'styledindicator-dx40',
    notGivenReasonInput: 'field-e5kc-input',
  },

  // -- Edit vaccine modal --
  editVaccine: {
    title: 'modaltitle-ojhf',
    vaccineDisplay: 'displayfield-jkpx-vaccine-translatedtext-igtk',
    brandInput: 'field-865y-input',
    countryField: 'field-8sou',
    diseaseSelect: 'field-jz48-select',
    locationGroupInput: 'field-zrlv-group-input',
    locationInput: 'field-zrlv-location-input',
    givenByInput: 'field-5sfc-input',
    batchInput: 'field-xycc-input',
    consentCheckbox: 'consentfield-rvwt-controlcheck',
    injectionSiteInput: 'field-inc8-input',
    confirmButton: 'formsubmitcancelrow-vv8q-confirmButton',
    recordedByInput: 'field-f1vm-input',
    supervisingInput: 'field-gcfk-input',
    areaSelect: 'selectinput-phtg-select',
    editButton: 'iconbutton-eull',
    locationGroupClear: 'field-zrlv-group-input-clearbutton',
    locationClear: 'field-zrlv-location-input-clearbutton',
    givenByClear: 'field-5sfc-input-clearbutton',
  },

  // -- Delete vaccine modal --
  deleteVaccine: {
    title: 'modaltitle-ojhf',
    content: 'modalcontent-bk4w',
    confirmButton: 'confirmbutton-y3tb',
  },
} as const;
