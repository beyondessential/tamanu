---
id: SYSERR
---

# System errors

Most API errors on the clinical web client are surfaced to the user as a toast describing what to do next. Some errors, however, don't communicate a specific action the user can take — an unclassified server failure gives them nothing to act on beyond "something went wrong". These are relegated instead: recorded for later review rather than interrupting the user, and surfaced in a dedicated System errors view where any user can see, sort, and report them to the Tamanu support team.

## Relegating server errors

An API error is classified into a toast kind (server-unreachable, edit-conflict, or an unclassified server error) before deciding how to present it. Server-unreachable and edit-conflict errors describe a specific action the user can retry or resolve, so they always show as a toast. An unclassified server error carries no such action, so it is relegated instead of toasted.

- [ ] An unclassified server error on the regular clinical client is recorded as a system error rather than shown as a toast, including while the current route is under the Facility admin section (Facility admin is part of the regular clinical client, not the separate admin panel).
- [ ] A server-unreachable or edit-conflict error is always shown as a toast, regardless of which client or route raised it.
- [ ] An unclassified server error raised while the current route is under the separate admin panel is shown as a toast rather than relegated.
- [ ] A relegated system error records its timestamp and a message describing the failed request's path and the server's error detail.

## The System errors view

The view lists every system error relegated during the current session in a sortable table, and is reachable from the sidebar under Facility admin. It requires no specific permission — any authenticated user can view and act on it.

- [ ] The System errors view is titled "System errors" and is listed under the Facility admin section of the sidebar for any authenticated user, regardless of role or permissions.
- [ ] The view's table has two sortable columns: date & time, and error message.
- [ ] Rows default to sorting by date & time, most recent first.
- [ ] When there are no system errors to show, the table displays "No system errors to display" instead of rows.
- [ ] The list of system errors is scoped to the current login session: it starts empty whenever a session begins (a fresh login or an existing session being resumed, such as on a page reload) and is cleared on logout, regardless of how the previous session ended.

## Retention

A system error is not kept indefinitely: it is only relevant for a short window after it happens. Age is checked when the view is visited rather than by a background process, so a system error can sit stale in memory between visits but is dropped as soon as the view is next opened.

- [ ] A system error older than 24 hours is removed from the table when the System errors view is visited.
- [ ] A system error younger than 24 hours is unaffected by a visit to the view.

## Sidebar unread indicator

The System errors item in the sidebar shows a red dot while there is at least one unread system error, so a relegated error is discoverable without the user needing to already be looking at the view. Visiting the view marks every system error present at that moment as read.

- [ ] A system error is unread from the moment it is relegated until the System errors view is next visited.
- [ ] The sidebar shows a red dot next to "System errors" whenever at least one system error is unread, and no dot otherwise.
- [ ] Visiting the System errors view marks every system error present in the table at that moment as read, clearing the dot.
- [ ] A system error relegated after the view was last visited is unread again, and the dot reappears.
- [ ] The unread indicator remains visible when the Facility admin section of the sidebar is collapsed, and when the sidebar itself is retracted to icons only.

## Sending a report to support

A user can send some or all of the system errors currently in the table to the Tamanu support team, along with free-text notes and an optional follow-up email address. Sending removes only the rows that were included in that submission from the table; any error relegated afterwards is unaffected.

- [ ] The System errors view has a "Send error log" action (singular wording for exactly one error, plural otherwise), which opens a modal reporting how many errors will be sent.
- [ ] The "Send error log" action is disabled when the table has no system errors, since there is nothing to report.
- [ ] The modal collects free-text additional information and an optional email address for the support team to use for follow-up; the email address, if entered, must be a valid email address.
- [ ] Submitting sends every system error currently in the table, the additional information, the follow-up email address (if entered), and the id of the user sending the report — no other information identifying the user is included.
- [ ] The report is emailed to the recipients configured for the reporting facility, defaulting to the Tamanu support address when the facility has not configured its own.
- [ ] On successful submission, the errors included in that submission are removed from the table, the modal closes, and the user sees a confirmation (singular or plural wording matching the count sent).
- [ ] If submission fails, the table is left unchanged, the modal stays open with the user's entered information intact, and the user sees a failure notification — a failed submission does not itself appear as a new system error.
