import { expect, Locator, Page } from '@playwright/test';

/**
 * Notification drawer opened from the dashboard top bar (bell).
 * Selectors are scoped to the drawer except the bell and unread badge, which live in the shell.
 */
export class NotificationDrawer {
  readonly openButton: Locator;
  readonly unreadIndicator: Locator;
  readonly drawer: Locator;
  readonly closeButton: Locator;
  readonly loadingIndicator: Locator;
  readonly unreadList: Locator;
  readonly readList: Locator;
  readonly unreadTitle: Locator;
  readonly readTitle: Locator;
  readonly markAllAsReadAction: Locator;
  readonly card: Locator;
  readonly bodyText: Locator;

  constructor(page: Page) {
    this.openButton = page.getByTestId('iconbutton-1sk8');
    this.unreadIndicator = page.getByTestId('notificationindicator-yrhl');
    this.drawer = page.getByTestId('styleddrawer-fn4h');
    this.closeButton = page.getByTestId('closebutton-rgw9');
    this.loadingIndicator = this.drawer.getByTestId('loadingindicator-36ut');
    this.unreadList = this.drawer.getByTestId('notificationlist-xmfz');
    this.readList = this.drawer.getByTestId('notificationlist-wek6');
    this.unreadTitle = this.drawer.getByTestId('unreadtitle-raz1');
    this.readTitle = this.drawer.getByTestId('readtitle-svo6');
    this.markAllAsReadAction = this.drawer.getByTestId('actionlink-10rj');
    this.card = this.drawer.getByTestId('cardcontainer-qqc2');
    this.bodyText = this.drawer.getByTestId('bodytext-xa84');
  }

  async open(): Promise<void> {
    await this.openButton.click();
    await expect(this.drawer).toBeVisible();
  }

  async close(): Promise<void> {
    await this.closeButton.click();
    await expect(this.drawer).toBeHidden();
  }

  async waitForLoaded(): Promise<void> {
    await expect(this.loadingIndicator).toBeHidden({ timeout: 30_000 });
    await expect(this.unreadList).toBeVisible({ timeout: 15_000 });
  }

  notificationByDisplayId(displayId: string): Locator {
    return this.bodyText.filter({ hasText: displayId });
  }

  readNotificationByDisplayId(displayId: string): Locator {
    return this.readList.getByText(displayId);
  }

  notificationCardByDisplayId(displayId: string): Locator {
    return this.card.filter({ hasText: displayId });
  }
}
