---
id: FREQ
---

# Administration frequencies

How often a prescribed medication is given. The frequency sets how many doses fall in a day, which windows of the medication administration schedule they occupy, and where doses appear on the medication administration record (MAR).

## Frequency list

- [ ] A prescriber chooses one frequency from the list below when prescribing a medication.
- [ ] Typing a synonym in the frequency field finds the frequency it belongs to.
- [ ] Each frequency has default administration times, used to prefill the medication administration schedule.

| Frequency | Synonyms | Default administration times |
|---|---|---|
| Daily in the morning | mane, Morning | 06:00 |
| Daily at midday | midday | 12:00 |
| Daily at night | nocte, nightly | 18:00 |
| Daily | D, Every 24 hours, q24h, q1d, Q.D., QD | 06:00 |
| Two times daily | BD, Every 12 hours, q12h, BID, B.D., Twice a day | 06:00, 18:00 |
| Three times daily | TID, TDS, T.I.D. | 06:00, 12:00, 18:00 |
| Four times daily | QID, QDS, Q.I.D. | 06:00, 12:00, 18:00, 22:00 |
| Every 2 hours | q2h, 2h, 2 hourly, 2 hrly | 00:00, 02:00, 04:00, 06:00, 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00, 22:00 |
| Every 4 hours | q4h, 4h, 4 hourly, 4 hrly | 02:00, 06:00, 10:00, 14:00, 18:00, 22:00 |
| Every 6 hours | q6h, 6h, 6 hourly, 6 hrly | 00:00, 06:00, 12:00, 18:00 |
| Every 8 hours | q8h, 8h, 8 hourly, 8 hrly | 06:00, 14:00, 22:00 |
| Hourly | Each hour, Q1h, 1/24, Every hour, Every 60 mins, Every one hour | Every hour on the hour |
| Half-hourly | Each half-hour, Q30m, 30/60, Every half hour, Every 30 mins, Every thirty mins | Every hour and half hour |
| Every second day | QOD, Q.O.D., Every other day | 06:00 |
| Once a week | Weekly, Once weekly | 06:00 |
| Once a month | Monthly, Q.M., QM, Once a month, Once monthly | 06:00 |
| Immediately | STAT, Immediately | None |
| As directed | MDU, As directed by doctor, M.D.U., As directed by prescriber, Variable dose, When required | None |
| Twice daily - AM and midday | AM and midday, BD - AM and midday, AM and lunch, BD - AM and lunch | 06:00, 12:00 |

## Settings

- [ ] The "Frequencies enabled" setting lists every frequency, and only enabled frequencies are offered when prescribing.
- [ ] Every frequency is enabled by default.
- [ ] The "Default administration times" setting overrides a frequency's default administration times for a deployment.
- [ ] "Default administration times" lists every frequency except Immediately, As directed, Hourly and Half-hourly.

## Medication administration schedule

- [ ] The schedule shows twelve two-hour windows across the day, each with an ideal administration time.
- [ ] Choosing a frequency selects the windows that hold its default administration times.
- [ ] A prescriber can select a different window as long as the number of selected windows matches the frequency's doses per day.
- [ ] The ideal administration time of a selected window can be edited within that window.
- [ ] With Every 2 hours, every window is selected and none can be deselected.
- [ ] Immediately and As directed have no schedule, and the windows are unavailable.
- [ ] Hourly and Half-hourly show no schedule, and their doses fall at their default administration times.

## Medication administration record

- [ ] The first dose on the MAR is the earliest ideal administration time after the prescription's start, or in the same window as the start.
- [ ] Later doses fall at the selected ideal administration times, on each day the frequency is due.
