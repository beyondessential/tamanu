import { Page } from '@playwright/test';
import { LabRequestModalBase } from './LabRequestModalBase';
import { PanelLabRequestModal } from './PanelLabRequestModal';
import { IndividualLabRequestModal } from './IndividualLabRequestModal';


export class LabRequestModal extends LabRequestModalBase {

  // Panel and Individual modal instances
  readonly panelModal: PanelLabRequestModal;
  readonly individualModal: IndividualLabRequestModal;

  constructor(page: Page) {
    super(page);

    // Initialize sub-modals
    this.panelModal = new PanelLabRequestModal(page);
    this.individualModal = new IndividualLabRequestModal(page);
  }
  
} 