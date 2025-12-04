import { Locator, Page } from '@playwright/test';
import { AddTaskModal } from '../modals/AddTaskModal';
import { MarkAsCompletedModal } from '../modals/MarkAsCompletedModal';
import { MarkAsNotCompletedModal } from '../modals/MarkAsNotCompletedModal';
import { DeleteTaskModal } from '../modals/DeleteTaskModal';

export class TasksPane {
  readonly page: Page;

  readonly addTaskButton!: Locator;
  readonly tasksTable!: Locator;
  readonly taskName!: Locator;
  readonly priorityIcon!: Locator;
  readonly tableBody!: Locator;
  readonly tableRows!: Locator;
  readonly markAsCompletedButton!: Locator;
  private _addTaskModal?: AddTaskModal;
  private _markAsCompletedModal?: MarkAsCompletedModal;
  private _markAsNotCompletedModal?: MarkAsNotCompletedModal;
  private _deleteTaskModal?: DeleteTaskModal;
  readonly showCompletedTasksCheck!: Locator;
  readonly markAsNotCompletedButton!: Locator;
  readonly showNotCompletedTasksCheck!: Locator;
  readonly deleteTaskButton!: Locator;
  readonly noDataContainer!: Locator;
  constructor(page: Page) {
    this.page = page;

    const testIds = {
      addTaskButton: 'button-a1te',
      tasksTable: 'taskstable-cv6v',
      priorityIcon: 'styledpriorityhighicon-7slu',
      tableBody: 'styledtablebody-a0jz',
      markAsCompletedButton: 'styledcheckcircleicon-31o6',
      showCompletedTasksCheck: 'styledcheckinput-kqdn-controlcheck',
      markAsNotCompletedButton: 'styledcancelicon-nzdl',
      showNotCompletedTasksCheck: 'styledcheckinput-vgby-controlcheck',
      deleteTaskButton: 'styleddeleteoutlineicon-w3ya',
      noDataContainer: 'nodatacontainer-476e',
    } as const;

    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }

    // Fields that need nested locators
    this.taskName = this.tasksTable.locator('[data-test-class*="name"]');
    this.tableRows = this.tableBody.locator('tr');
  }
  async getRowCount(): Promise<number> {
    return await this.tableRows.count();
  }

  async waitForPageToLoad(): Promise<void> {
    await this.addTaskButton.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

async waitForNoDataContainerToDisappear(): Promise<void> {
  await this.noDataContainer.waitFor({ state: 'detached' });
  await this.page.waitForLoadState('networkidle', { timeout: 10000 });
}


  getAddTaskModal(): AddTaskModal {
    if (!this._addTaskModal) {
      this._addTaskModal = new AddTaskModal(this.page);
    }
    return this._addTaskModal;
  }

  getMarkAsCompletedModal(): MarkAsCompletedModal {
    if (!this._markAsCompletedModal) {
      this._markAsCompletedModal = new MarkAsCompletedModal(this.page);
    }
    return this._markAsCompletedModal;
  }

  getMarkAsNotCompletedModal(): MarkAsNotCompletedModal {
    if (!this._markAsNotCompletedModal) {
      this._markAsNotCompletedModal = new MarkAsNotCompletedModal(this.page);
    }
    return this._markAsNotCompletedModal;
  }

  getDeleteTaskModal(): DeleteTaskModal {
    if (!this._deleteTaskModal) {
      this._deleteTaskModal = new DeleteTaskModal(this.page);
    }
    return this._deleteTaskModal;
  }

  async createARepeatingTask(options: {
    taskName: string;
    notes?: string;
    currentUserDisplayName?: string;
    frequencyValue?: number;
    frequencyUnit?: string;
    durationValue?: number;
    durationUnit?: string;
  }): Promise<{ name: string; notes?: string; dateTime: string }> {
    await this.addTaskButton.click();
    const addTaskModal = this.getAddTaskModal();
    await addTaskModal.waitForModalToLoad();
    
    const formValues = await addTaskModal.fillForm({
      taskName: options.taskName,
      notes: options.notes,
      isRepeating: true,
      frequencyValue: options.frequencyValue,
      frequencyUnit: options.frequencyUnit,
      durationValue: options.durationValue,
      durationUnit: options.durationUnit,
    });
    
    await addTaskModal.confirmButton.click();
    await this.waitForPageToLoad();
    
    return formValues;
  }
}

