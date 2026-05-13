import { expect, Locator, Page } from '@playwright/test';

import { routes } from '../config/routes';
import { constructFacilityUrl } from '../utils/navigation';
import { BasePage } from './BasePage';
import { RecentlyViewedPatientsList } from './patients/RecentlyViewedPatientsList';

export class DashboardPage extends BasePage {
  readonly topBar: Locator;
  readonly greetingHeading: Locator;
  readonly subtitle: Locator;
  readonly notificationButton: Locator;
  readonly notificationDrawer: Locator;
  readonly notificationDrawerCloseButton: Locator;
  readonly notificationDrawerLoadingIndicator: Locator;
  readonly unreadNotificationList: Locator;
  readonly readNotificationList: Locator;
  readonly unreadNotificationTitle: Locator;
  readonly readNotificationTitle: Locator;
  readonly markAllAsReadAction: Locator;
  readonly notificationCard: Locator;
  readonly notificationBodyText: Locator;
  readonly unreadNotificationIndicator: Locator;
  readonly recentlyViewedPatientsList: RecentlyViewedPatientsList;
  /** Welcome-only dashboard (no tasks, appointments, or bookings panes). */
  readonly welcomeLayoutRoot: Locator;
  readonly welcomePageContainer: Locator;
  readonly welcomeDescription: Locator;
  readonly welcomeHeroTitle: Locator;
  readonly welcomeImage: Locator;
  /** Full dashboard with scheduling/tasks region (when any pane is enabled). */
  readonly mainPageContainer: Locator;
  readonly dashboardLayout: Locator;
  readonly patientsTasksContainer: Locator;
  readonly dashboardTaskPane: Locator;
  readonly taskPane: Locator;
  readonly schedulePanesContainer: Locator;
  readonly appointmentsPane: Locator;
  readonly bookingsPane: Locator;
  readonly todayAppointmentsViewAllLink: Locator;
  readonly todayBookingsViewAllLink: Locator;
  readonly taskLocationInput: Locator;
  readonly taskHighPriorityOnlyInput: Locator;
  readonly tasksTable: Locator;

  constructor(page: Page) {
    super(page, routes.dashboard);

    this.topBar = page.getByTestId('topbarcontainer-v4hx');
    this.greetingHeading = page.getByTestId('heading1-2w7n');
    this.subtitle = page.getByTestId('heading5-iho5');
    this.notificationButton = page.getByTestId('iconbutton-1sk8');
    this.notificationDrawer = page.getByTestId('styleddrawer-fn4h');
    this.notificationDrawerCloseButton = page.getByTestId('closebutton-rgw9');
    this.notificationDrawerLoadingIndicator = this.notificationDrawer.getByTestId('loadingindicator-36ut');
    this.unreadNotificationList = this.notificationDrawer.getByTestId('notificationlist-xmfz');
    this.readNotificationList = this.notificationDrawer.getByTestId('notificationlist-wek6');
    this.unreadNotificationTitle = this.notificationDrawer.getByTestId('unreadtitle-raz1');
    this.readNotificationTitle = this.notificationDrawer.getByTestId('readtitle-svo6');
    this.markAllAsReadAction = this.notificationDrawer.getByTestId('actionlink-10rj');
    this.notificationCard = this.notificationDrawer.getByTestId('cardcontainer-qqc2');
    this.notificationBodyText = this.notificationDrawer.getByTestId('bodytext-xa84');
    this.unreadNotificationIndicator = page.getByTestId('notificationindicator-yrhl');
    this.recentlyViewedPatientsList = new RecentlyViewedPatientsList(page);

    this.welcomeLayoutRoot = page.getByTestId('welcomepane-ryx6');
    this.welcomePageContainer = page.getByTestId('welcomepagecontainer-gsx9');
    this.welcomeDescription = page.getByTestId('translatedtext-7sbq');
    this.welcomeHeroTitle = page.getByTestId('translatedtext-hhz4');
    this.welcomeImage = page.getByTestId('welcomeimage-gw9i');

    this.mainPageContainer = page.getByTestId('pagecontainer-d57g');
    this.dashboardLayout = page.getByTestId('dashboardlayout-fufu');
    this.patientsTasksContainer = page.getByTestId('patientstaskscontainer-mqob');
    this.dashboardTaskPane = page.getByTestId('dashboardtaskpane-42x7');
    this.taskPane = page.getByTestId('tabpane-s00l');
    this.schedulePanesContainer = page.getByTestId('schedulepanescontainer-tiyj');
    this.appointmentsPane = this.schedulePanesContainer.getByTestId('container-txmf');
    this.bookingsPane = this.schedulePanesContainer.getByTestId('container-jfr4');
    this.todayAppointmentsViewAllLink = this.appointmentsPane.getByTestId('actionlink-spki');
    this.todayBookingsViewAllLink = this.bookingsPane.getByTestId('actionlink-5g8z');
    this.taskLocationInput = this.dashboardTaskPane.getByTestId('locationinput-aabz');
    this.taskHighPriorityOnlyInput = this.dashboardTaskPane.getByTestId('styledcheckinput-fzec');
    this.tasksTable = this.dashboardTaskPane.getByTestId('styledtable-l8ab');
  }

  async goto(): Promise<void> {
    await super.goto();
    await this.waitForLoaded();
  }

  async waitForLoaded(): Promise<void> {
    await this.page.waitForURL(constructFacilityUrl(routes.dashboard));
    const loadTimeout = 30_000;
    await expect(this.topBar).toBeVisible({ timeout: loadTimeout });
    await expect(this.greetingHeading).toBeVisible({ timeout: loadTimeout });
  }

  async openNotificationDrawer(): Promise<void> {
    await this.notificationButton.click();
    await expect(this.notificationDrawer).toBeVisible();
  }

  async closeNotificationDrawer(): Promise<void> {
    await this.notificationDrawerCloseButton.click();
    await expect(this.notificationDrawer).toBeHidden();
  }

  async waitForNotificationDrawerLoaded(): Promise<void> {
    await expect(this.notificationDrawerLoadingIndicator).toBeHidden({ timeout: 30_000 });
    await expect(this.unreadNotificationList).toBeVisible({ timeout: 15_000 });
  }

  notificationByDisplayId(displayId: string): Locator {
    return this.notificationBodyText.filter({ hasText: displayId });
  }

  readNotificationByDisplayId(displayId: string): Locator {
    return this.readNotificationList.getByText(displayId);
  }

  notificationCardByDisplayId(displayId: string): Locator {
    return this.notificationCard.filter({ has: this.notificationByDisplayId(displayId) });
  }

  bookingPatientName(fullName: string): Locator {
    return this.bookingsPane.getByText(fullName, { exact: true });
  }

  async clickTodayAppointmentsViewAll(): Promise<void> {
    await this.todayAppointmentsViewAllLink.click();
  }

  async clickTodayBookingsViewAll(): Promise<void> {
    await this.todayBookingsViewAllLink.click();
  }

  async setTaskHighPriorityOnly(enabled: boolean): Promise<void> {
    const checkbox = this.taskHighPriorityOnlyInput.getByRole('checkbox');
    if (enabled) {
      await checkbox.check();
    } else {
      await checkbox.uncheck();
    }
  }

  async assertTaskVisible(taskName: string): Promise<void> {
    await expect(this.dashboardTaskPane.getByText(taskName)).toBeVisible({ timeout: 20_000 });
  }

  async assertTaskNotVisible(taskName: string): Promise<void> {
    await expect(this.dashboardTaskPane.getByText(taskName)).toHaveCount(0);
  }

  async sortTasksByColumn(columnName: string): Promise<void> {
    await this.tasksTable.getByRole('columnheader', { name: columnName }).click();
  }

  async expectTaskColumnSort(columnName: string, direction: 'ascending' | 'descending'): Promise<void> {
    await expect(this.tasksTable.getByRole('columnheader', { name: columnName })).toHaveAttribute(
      'aria-sort',
      direction,
    );
  }

  async expectGreetingContains(displayName: string): Promise<void> {
    await expect(this.greetingHeading).toContainText('Hi');
    await expect(this.greetingHeading).toContainText(displayName);
  }

  async isWelcomeOnlyLayout(): Promise<boolean> {
    return this.welcomeLayoutRoot.isVisible();
  }

  async isMainDashboardLayout(): Promise<boolean> {
    return this.mainPageContainer.isVisible();
  }
}
