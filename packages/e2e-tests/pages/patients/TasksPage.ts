import { Locator, Page, expect } from '@playwright/test';
import { ids } from '@ids';
import { fillDate, fillTime, fillDateTime } from '@helpers/dates';
import { selectOption } from '@helpers/fields';

// ---------------------------------------------------------------------------
// Tasks Pane
// ---------------------------------------------------------------------------

export class TasksPane {
  readonly addButton: Locator;
  readonly table: Locator;
  readonly tableBody: Locator;
  readonly highPriorityIcon: Locator;
  readonly completeIcon: Locator;
  readonly completeCheckbox: Locator;
  readonly cancelIcon: Locator;
  readonly notCompleteCheckbox: Locator;
  readonly deleteIcon: Locator;
  readonly noDataContainer: Locator;

  constructor(readonly page: Page) {
    const t = ids.tasksPane;
    this.addButton = page.getByTestId(t.addButton);
    this.table = page.getByTestId(t.table);
    this.tableBody = page.getByTestId(ids.table.body);
    this.highPriorityIcon = page.getByTestId(t.highPriorityIcon);
    this.completeIcon = page.getByTestId(t.completeIcon);
    this.completeCheckbox = page.getByTestId(t.completeCheckbox);
    this.cancelIcon = page.getByTestId(t.cancelIcon);
    this.notCompleteCheckbox = page.getByTestId(t.notCompleteCheckbox);
    this.deleteIcon = page.getByTestId(t.deleteIcon);
    this.noDataContainer = page.getByTestId(t.noDataContainer);
  }

  async waitForPaneToLoad(): Promise<void> {
    await this.table.waitFor({ state: 'visible' });
  }
}

// ---------------------------------------------------------------------------
// Add Task Modal
// ---------------------------------------------------------------------------

export class AddTaskModal {
  readonly nameField: Locator;
  readonly dueDateField: Locator;
  readonly requestedByInput: Locator;
  readonly dueTimeField: Locator;
  readonly descriptionInput: Locator;
  readonly frequencyField: Locator;
  readonly prioritySelect: Locator;
  readonly designationSelect: Locator;
  readonly highPriorityCheck: Locator;
  readonly assigneeSelect: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(readonly page: Page) {
    const a = ids.addTask;
    this.nameField = page.getByTestId(a.nameField);
    this.dueDateField = page.getByTestId(a.dueDateField);
    this.requestedByInput = page.getByTestId(a.requestedByInput).locator('input');
    this.dueTimeField = page.getByTestId(a.dueTimeField);
    this.descriptionInput = page.getByTestId(a.descriptionInput).locator('textarea').first();
    this.frequencyField = page.getByTestId(a.frequencyField);
    this.prioritySelect = page.getByTestId(a.prioritySelect);
    this.designationSelect = page.getByTestId(a.designationSelect);
    this.highPriorityCheck = page.getByTestId(a.highPriorityCheck);
    this.assigneeSelect = page.getByTestId(a.assigneeSelect);
    this.confirmButton = page.getByTestId(a.confirmButton);
    this.cancelButton = page.getByTestId(a.cancelButton);
  }

  async waitForOpen(): Promise<void> {
    await this.nameField.waitFor({ state: 'visible' });
  }
}

// ---------------------------------------------------------------------------
// Mark Completed / Not Completed / Delete modals
// ---------------------------------------------------------------------------

export class MarkCompletedModal {
  readonly completedByInput: Locator;
  readonly completedDateField: Locator;
  readonly notesInput: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(readonly page: Page) {
    const m = ids.markCompleted;
    this.completedByInput = page.getByTestId(m.completedByInput).locator('input');
    this.completedDateField = page.getByTestId(m.completedDateField);
    this.notesInput = page.getByTestId(m.notesInput).locator('textarea').first();
    this.confirmButton = page.getByTestId(m.confirmButton);
    this.cancelButton = page.getByTestId(m.cancelButton);
  }
}

export class MarkNotCompletedModal {
  readonly notCompletedByInput: Locator;
  readonly dateField: Locator;
  readonly reasonInput: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(readonly page: Page) {
    const m = ids.markNotCompleted;
    this.notCompletedByInput = page.getByTestId(m.notCompletedByInput).locator('input');
    this.dateField = page.getByTestId(m.dateField);
    this.reasonInput = page.getByTestId(m.reasonInput).locator('textarea').first();
    this.confirmButton = page.getByTestId(m.confirmButton);
    this.cancelButton = page.getByTestId(m.cancelButton);
  }
}

export class DeleteTaskModal {
  readonly deletedByInput: Locator;
  readonly dateField: Locator;
  readonly reasonInput: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(readonly page: Page) {
    const m = ids.deleteTask;
    this.deletedByInput = page.getByTestId(m.deletedByInput).locator('input');
    this.dateField = page.getByTestId(m.dateField);
    this.reasonInput = page.getByTestId(m.reasonInput).locator('textarea').first();
    this.confirmButton = page.getByTestId(m.confirmButton);
    this.cancelButton = page.getByTestId(m.cancelButton);
  }
}
