# CHANGELOG

## vNEXT

### Manual steps required after upgrade ⚙

- (left blank)

### Features ⭐

- (left blank)

### Tweaks ⚖️

- (left blank)

### Bug fixes 🐛

- (left blank)

### Infrastructure and maintenance 🛠

- (left blank)

## v1.17.1

### Manual steps required after upgrade ⚙

- (left blank)

### Features ⭐

- (left blank)

### Tweaks ⚖️

- (left blank)

### Bug fixes 🐛

- (left blank)

### Infrastructure and maintenance 🛠

- (left blank)

## v1.17.0

### Manual steps required after upgrade ⚙

- Set `enablePatientDeaths` in sync-server config (if required)
  - `localisation.data.features.enablePatientDeaths`
- Remove `localisation.data.covidVaccines`
- Import Certifiable Vaccines (if required) data

### Features ⭐

- Logs updated with various pieces of additional diagnostic info
- Logs can now be sent to Honeycomb for central viewing/querying
- Added printing options for lab requests, imaging requests, and prescriptions
- Vaccines that can have a QR code (VDS-NC or EU DCC) are now configured via the Certifiable Vaccines imported data, rather than being hardcoded

### Tweaks ⚖️

- (left blank)

### Bug fixes 🐛

- (left blank)

### Infrastructure and maintenance 🛠

- Drop deprecated `X-Runtime` header (except in meta server).

## v1.16.3

### Manual steps required after upgrade ⚙

- (left blank)

### Features ⭐

- (left blank)

### Tweaks ⚖️

- (left blank)

### Bug fixes 🐛

- VDS encodes dates as sync-server timezone to match PDF

### Infrastructure and maintenance 🛠

- (left blank)

## v1.16.2

### Manual steps required after upgrade ⚙

- (left blank)

### Features ⭐

- (left blank)

### Tweaks ⚖️

- (left blank)

### Bug fixes 🐛

- Added support for Moderna to VDS

### Infrastructure and maintenance 🛠

- (left blank)

## v1.16.1

### Bug fixes 🐛

- Fix issue that was causing mobile sync to break after editing patient details

## v1.16.0

### Manual steps required after upgrade ⚙

- Regenerate the server secret to log all mobile users out, so they get prompted to upgrade (only needs to be done once per server)
  - This means generating a long random string using e.g. LastPass or some other secure tool and setting `config.auth.secret` to that string
- Set `previewUvciFormat` in sync-server config (if required)
  - `localisation.data.previewUvciFormat`

### Features ⭐

- (left blank)

### Tweaks ⚖️

- Scheduled tasks are now split into a separate command, so `pm2 scale` works up and down now. A new PM2 process will appear: `tamanu-tasks-runner` (only one instance should run at all times).

### Bug fixes 🐛

- Fix bug where users with an outdated version weren't logged out properly

### Infrastructure and maintenance 🛠

- (left blank)

## v1.15.3

### Tweaks ⚖️

- Updated dimensions of patient sticker sheet
- Add close button to appointment details modal

## v1.15.2

### Manual steps required after upgrade ⚙

- (left blank)

### Features ⭐

- (left blank)

### Tweaks ⚖️

- Updated patient suggester to search for displayId and full name

### Bug fixes 🐛

- Fixed migration that could fail under certain conditions

### Infrastructure and maintenance 🛠

- (left blank)

## v1.15.1

### Manual steps required after upgrade ⚙

- (left blank)

### Features ⭐

- (left blank)

### Tweaks ⚖️

- (left blank)

### Bug fixes 🐛

- Fix some bugs to do with vaccine certificates

### Infrastructure and maintenance 🛠

- (left blank)

## v1.15.0

### Manual steps required after upgrade ⚙
- Add an entry for `questionCodeIds.passport` and `questionCodeIds.nationalityId` in the config to look up survey
responses for patients in covid lab test certificates
- Delete any override to config's `log.consoleLevel` (it has a new default)
- If the console output is full of `\e[He[2J` garbage output, set `log.color` to `false` and let the devs know (it's unexpected but possible)
- The `localisation.data.country` section is now required to be filled in.

### Features ⭐

- (left blank)

### Tweaks ⚖️

- Improved console output (color coding, timestamps, originating IP addresses, new log level for http requests)
  - For reference, the logging levels in order are: error, warn, info (old default), http (new default), verbose, debug, silly
- `loadIcaoSigner` sync-server sub-command was renamed to `loadSigner`

### Bug fixes 🐛

- (left blank)

### Infrastructure and maintenance 🛠

- (left blank)

## v1.14.2

### Features ⭐

- Add task to automatically result + publish some lab tests

### Bug fixes 🐛

- Fix issue that was causing lab tests and requests to revert some fields

## v1.14.1

### Manual steps required after upgrade ⚙
- Add an entry for `questionCodeIds.passport` and `questionCodeIds.nationalityId` in the config to look up survey
responses for patients in covid lab test certificates
- Add entry for certificate notifications such as `notifications.certificates.labTestCategoryIds: ["labTestCategory-COVID", "labTestCategory-COVIDRAT"]`

### Features ⭐

- (left blank)

### Tweaks ⚖️

- (left blank)

### Bug fixes 🐛

- (left blank)

### Infrastructure and maintenance 🛠

- (left blank)

## v1.14.0

### Manual steps required after upgrade ⚙

- Change `vaccineCertificateFooter` key in the config to `vaccineCertificate` refer to default.json
- Consider adding `fiji-aspen-encounter-summary-line-list` to disabledReports
- A server with invalid localisation will now exit: fix the localisation (preferred), or set `localisation.allowInvalidLocalisation` to `true` (if there's a good reason why it's invalid)
- Add a `localisation.data.country` section to the config with country name and ISO 3166 codes
- VDS Signer integration config structure has changed, refer to default.json

### Features ⭐

- Add new report `fiji-aspen-encounter-summary-line-list`

- EU DCC integration. To enable:
  - Configure the `signer` integration.
  - Enable the `euDcc` integration.

### Tweaks ⚖️

- Tweaked localisation to prepare for loading it from the db
- "VDS" scheduled tasks were renamed to "Signer", `schedules` config keys have changed in consequence
- Hid the "Forgot your password?" page and link

### Bug fixes 🐛

- (left blank)

### Infrastructure and maintenance 🛠

- (left blank)

## v1.13.2

### Bug fixes 🐛

- Fix issue that was causing sync attempts to fail unpredictably

## v1.13.1

### Manual steps required after upgrade ⚙

- (left blank)

### Features ⭐

- (left blank)

### Tweaks ⚖️

- (left blank)

### Bug fixes 🐛

- (left blank)

### Infrastructure and maintenance 🛠

- (left blank)

## v1.13.0

### Manual steps required after upgrade ⚙

- (left blank)

### Features ⭐

- (left blank)

### Tweaks ⚖️

- Moved migrations to subcommands (e.g. what was `node ./app.bundle.js migrate --up` now becomes `node app.bundle.js migrate up`)
- Migrated argument parsing from argparse to commander.js

### Bug fixes 🐛

- Fixed temp folders not already existing on Windows hosts in lan (was already fixed in sync)

### Infrastructure and maintenance 🛠

- (left blank)

## v1.12.4

### Manual steps required after upgrade ⚙

- (left blank)

### Features ⭐

- (left blank)

### Tweaks ⚖️

- Small tweaks to `kiribati-covid-swab-lab-test-list`

### Bug fixes 🐛

- (left blank)

### Infrastructure and maintenance 🛠

- (left blank)

## v1.12.3

### Manual steps required after upgrade ⚙

- Consider adding `kiribati-covid-swab-lab-test-list` to disabledReports.

### Features ⭐

- New report for Kiribati.

### Tweaks ⚖️

- (left blank)

### Bug fixes 🐛

- (left blank)

### Infrastructure and maintenance 🛠

- (left blank)

## v1.12.2

### Manual steps required after upgrade ⚙

- (left blank)

### Features ⭐

- (left blank)

### Tweaks ⚖️

- (left blank)

### Bug fixes 🐛

- (left blank)

### Infrastructure and maintenance 🛠

- (left blank)

## v1.12.1

### Manual steps required after upgrade ⚙

- change any reference to `covid-swab-lab-test-list` (such as in disabledReports) to `fiji-covid-swab-lab-test-list`

### Features ⭐

- (left blank)

### Tweaks ⚖️

- (left blank)

### Bug fixes 🐛

- (left blank)

### Infrastructure and maintenance 🛠

- (left blank)

## v1.12.0

### Manual steps required after upgrade ⚙

- Run `npm install` to install new dependency (check-disk-usage) and downgrade babel-jest
- Add the asset `certificate-bottom-half-img` to each deployment
- Reimport facilities after mobile update has been deployed

### Features ⭐

- Central server has the ability to check available disk space based on current config.
- Lan servers will auto-discontinue medications after their end date is due (based on facility).
- Replace the bottom half of certificates with a configurable image

### Tweaks ⚖️

- Add `react-hooks/exhaustive-deps` and `react-hooks/rules-of-hooks` linter rules

### Bug fixes 🐛

- Referrals now no longer display in the Programs tab
- Allow lan server to start with serverFacilityId blank if sync.enabled is false, to allow an initial data import of facilities

### Infrastructure and maintenance 🛠

- Add Demo (Tuvalu) to meta-server

## v1.11.0

### Manual steps required after upgrade ⚙

- Fiji only:
  - set appropriate HL7 settings in local.json
    - specifically:

```
  "hl7": {
    "assigners": {
      "patientDisplayId": "VRS"
    },
    "dataDictionaries": {
      "patientDisplayId": "http://data-dictionary.tamanu-fiji.org/application-reference-number.html",
      "labRequestDisplayId": "http://data-dictionary.tamanu-fiji.org/labrequest-reference-number.html"
    },
  },
```

- Everywhere:
  - set a `canonicalHostName` in `local.json`:

```
{
   "canonicalHostName": "https://example.com"
}
```

### Features ⭐

- New 'medications' section in patient summary view.
- Discharge modal now displays a list of active medicines that can be selected.
- Added integration with Fiji's VPS
- Added integration with Fiji's VRS

### Tweaks ⚖️

- Forms can now display custom error messages.
- EncounterMedication model now has two new fields: isDischarge and repeats.
- New migration for encounter_medications table to account for the new fields.
- Encounter api route now manages selected discharge medications.
- Split SelectField and MultiselectField into distinct components
- SelectField no longer internally tracks its value
- Remove 'required' attribute for Completed by and Location fields in ImagingRequestView

### Bug fixes 🐛

- (left blank)

### Infrastructure and maintenance 🛠

- (left blank)

## v1.10.0

### Manual steps required after upgrade ⚙

- Set `serverFacilityId` in LAN local.json to a valid facilityId
  - Valid facilities will need to have been imported to sync server previously
- Set `updateUrls.mobile` to an appropriate appcenter download link
  - for eg `https://install.appcenter.ms/orgs/beyond-essential/apps/tamanu-mobile/distribution_groups/samoa`

### Features ⭐

- LAN server is aware of which facility it represents

### Tweaks ⚖️

- Updated logic for the covid-swab-lab-test-list report

### Bug fixes 🐛

- (left blank)

### Infrastructure and maintenance 🛠

- (left blank)

## v1.9.0

### Manual steps required after upgrade ⚙

- Add appropriate codes for default department and location for surveys to `packages/lan-server/local.json`:

```
"survey": {
  "defaultCodes": {
    "department": "xxxxxx",
    "location": "xxxxxx",
  },
},
```

- Add to samoa `packages/sync-server/local.json`:

```
"tupaiaApiClient": {
    "auth": {
        "username": "tamanu-server@tupaia.org",
        "password": "" // find in lastpass, search for tamanu-server@tupaia.org
    },
    "environment": "production"
},
```

- For Samoa sync-server (1.10.0), enable running report in child process on again by switching in `packages/sync-server/local.json`:

```
"reportProcess": {
    "runInChildProcess": true
},
```

### Features ⭐

- Active COVID-19 Patients table

### Tweaks ⚖️

- Remove character limit on SurveyResponseAnswer.body

### Bug fixes 🐛

- Fix OutpatientDischarger performance and schedule not working.

### Infrastructure and maintenance 🛠

- Separate Facilities, Departments and Locations into distinct models
- Mitigate codeship awscli tools EB version name collision, in our deployment steps
- Deploy production meta-server from dev branch

## v1.8.0

### Manual steps required after upgrade ⚙

- (left blank)

### Features ⭐

- (left blank)

### Tweaks ⚖️

- (left blank)

### Bug fixes 🐛

- (left blank)

### Infrastructure and maintenance 🛠

- (left blank)

## v1.8.4

### Bug fixes 🐛

- Fix bug where loadshedder might fail to release lock

## v1.8.3

### Bug fixes 🐛

- Prevent sequelize nesting encounter queries on export

## v1.8.2

### Tweaks ⚖️

- Added loadshedder middleware to keep system more operational under load

## v1.8.1

### Bug fixes 🐛

- Disabled potentially unstable outpatient discharger task

## v1.8.0

### Manual steps required after upgrade ⚙

- (left blank)

### Features ⭐

- Add registered patients line-list report
- Add India assistive technology device line list report
- Add Iraq assistive technology device line list report
- Add PNG assistive technology device line list report
- Add Generic Vaccine line list report
- Allow disabling reports through server config
- Allow running reports in child process

### Tweaks ⚖️

- Renamed SyncMetadata to ChannelSyncPullCursor
- Facility server now throws an error when connecting to a sync server if it had previously connected to a different one
- Reports generated by sync server are zipped before sending out via email
- Limit /sync/channels concurrency to 8 (by default) concurrent queries to reduce connection pool contention

### Bug fixes 🐛

- Changed Country to Country of birth and only allow ALL FACILITIES in registered patients line-list report

### Infrastructure and maintenance 🛠

- Removed Tonga from meta-server
- Made ./scripts/version.sh safer
