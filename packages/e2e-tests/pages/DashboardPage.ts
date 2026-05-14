import { expect, Locator, Page } from '@playwright/test';

import { routes } from '../config/routes';
import { constructFacilityUrl } from '../utils/navigation';
import { BasePage } from './BasePage';
import { DashboardTaskPane } from './dashboard/DashboardTaskPane';
import { NotificationDrawer } from './dashboard/NotificationDrawer';
import { RecentlyViewedPatientsList } from './patients/RecentlyViewedPatientsList';

export class DashboardPage extends BasePage {
  readonly topBar: Locator;
  readonly greetingHeading: Locator;
  readonly subtitle: Locator;
  readonly notifications: NotificationDrawer;
  readonly tasking: DashboardTaskPane;
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
  readonly schedulePanesContainer: Locator;
  readonly appointmentsPane: Locator;
  readonly bookingsPane: Locator;
  readonly todayAppointmentsViewAllLink: Locator;
  readonly todayBookingsViewAllLink: Locator;

  constructor(page: Page) {
    super(page, routes.dashboard);

    this.topBar = page.getByTestId('topbarcontainer-v4hx');
    this.greetingHeading = page.getByTestId('heading1-2w7n');
    this.subtitle = page.getByTestId('heading5-iho5');
    this.notifications = new NotificationDrawer(page);
    this.tasking = new DashboardTaskPane(page);
    this.recentlyViewedPatientsList = new RecentlyViewedPatientsList(page);

    this.welcomeLayoutRoot = page.getByTestId('welcomepane-ryx6');
    this.welcomePageContainer = page.getByTestId('welcomepagecontainer-gsx9');
    this.welcomeDescription = page.getByTestId('translatedtext-7sbq');
    this.welcomeHeroTitle = page.getByTestId('translatedtext-hhz4');
    this.welcomeImage = page.getByTestId('welcomeimage-gw9i');

    this.mainPageContainer = page.getByTestId('pagecontainer-d57g');
    this.dashboardLayout = page.getByTestId('dashboardlayout-fufu');
    this.patientsTasksContainer = page.getByTestId('patientstaskscontainer-mqob');
    this.schedulePanesContainer = page.getByTestId('schedulepanescontainer-tiyj');
    this.appointmentsPane = this.schedulePanesContainer.getByTestId('container-txmf');
    this.bookingsPane = this.schedulePanesContainer.getByTestId('container-jfr4');
    this.todayAppointmentsViewAllLink = this.appointmentsPane.getByTestId('actionlink-spki');
    this.todayBookingsViewAllLink = this.bookingsPane.getByTestId('actionlink-5g8z');
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

  bookingPatientName(fullName: string): Locator {
    return this.bookingsPane.getByText(fullName, { exact: true });
  }

  async clickTodayAppointmentsViewAll(): Promise<void> {
    await this.todayAppointmentsViewAllLink.click();
  }

  async clickTodayBookingsViewAll(): Promise<void> {
    await this.todayBookingsViewAllLink.click();
  }

  async expectGreetingContains(displayName: string): Promise<void> {
    await expect(this.greetingHeading).toContainText('Hi');
    await expect(this.greetingHeading).toContainText(displayName);
  }
}
