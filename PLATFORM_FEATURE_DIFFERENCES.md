# Tamanu Platform Feature Differences

This document outlines the key differences between the Tamanu Desktop (Web) and Mobile applications.

## Platform Overview

- **Desktop (Web)**: Comprehensive facility management system running in web browsers (`packages/web/`)
- **Mobile**: React Native Android app for point-of-care data entry (`packages/mobile/`)

## Major Feature Differences

### Billing & Invoicing

**Desktop Only**
- Full invoice creation and management
- Payment processing and refunds
- Insurer payment administration
- Pricing profiles and price management
- Invoice discounts

**Mobile**
- No billing capabilities
- Only stores patient billing type for reference

### Reports

**Desktop**
- Advanced report generator with custom parameters
- Multiple export formats (Excel, CSV)
- Email delivery
- Report scheduling and versioning
- Report administration panel

**Mobile**
- Basic summary reports (visit charts, encounter counts)
- Survey data tables
- 28-day visit history
- Email-based data export
- No custom report configuration

### Scheduling & Appointments

**Desktop Only**
- Outpatient appointment booking
- Calendar views (daily, weekly)
- Appointment management (create, modify, cancel)
- Repeating appointments
- Location-based bookings
- Bed management dashboard with occupancy tracking

**Mobile**
- No appointment scheduling
- No calendar interface
- Only appointment reminder notification checkbox

### Administrative Functions

**Desktop Only**
- User management and permissions administration
- Reference data management
- Translation management
- Program and template administration
- FHIR integration management
- Asset uploader
- Patient merge functionality
- Sync status monitoring across all devices

**Mobile**
- Basic settings only (profile, support, sign out)
- No administrative interfaces

### Clinical Documentation

**Desktop**
- 11-tab encounter view (Tasks, Vitals, Charts, Notes, Procedures, Labs, Imaging, Medication, Forms, Documents, Invoicing)
- Discharge summary generation
- MAR (Medication Administration Record)
- Procedures tracking
- Document management pane
- Patient certificates and printouts

**Mobile**
- Modular patient workflow (Diagnosis & Treatment, Vitals, Programs, Referral, Vaccine, Tests)
- Basic illness/diagnosis entry
- Photo upload via camera
- No discharge summaries
- No MAR view
- No procedures interface

### Lab & Imaging

**Desktop**
- Separate modules for labs and imaging
- Active and completed request views
- Published lab results management
- Full imaging request lifecycle

**Mobile**
- Lab requests only
- Simplified lab workflow
- No imaging request management

### Medication Management

**Desktop**
- Full dispensing system
- MAR for administration tracking
- Active and dispensed medication views
- Patient-level and encounter-level views

**Mobile**
- Prescription creation only
- No dispensing tracking
- No MAR

### Charting & Visualization

**Desktop**
- Advanced charting system with historical vital data
- Custom chart components per vital type
- ChartDataProvider context

**Mobile**
- Basic 28-day visit chart
- Simple vital history
- Limited visualization

## Mobile-Specific Features

**Offline-First Architecture**
- Full local SQLite database using TypeORM
- Complete offline functionality
- Data syncs every 5 minutes when connected
- Dedicated sync interface with real-time progress
- Keep-awake during sync
- Export data functionality for field workers

**Mobile Hardware Integration**
- Camera for photo capture
- Device ID tracking
- Native mobile UI components

## Features with Similar Parity

Both platforms support:
- Patient registration and search
- Vital signs recording
- Vaccination tracking
- Program registries and surveys
- Lab requests
- Referrals
- Patient details management
- Diagnosis entry
- Authentication and facility selection
- Internationalization/translation support

## Design Philosophy

**Desktop (Web)**
- Comprehensive clinical workstation
- Multi-patient workflow management
- Administrative capabilities
- Financial management and reporting
- Resource scheduling
- Server-based with online focus

**Mobile**
- Point-of-care data collection
- Offline-capable for remote/disconnected environments
- Simplified, streamlined workflows
- Essential clinical functions
- Field worker focused
- Data sync and export priority

## Platform Selection Guide

**Use Desktop When:**
- Working in a healthcare facility with reliable internet
- Need comprehensive patient management
- Require billing/invoicing
- Managing appointments and bed occupancy
- Generating custom reports
- Performing administrative tasks
- Managing multiple patients simultaneously

**Use Mobile When:**
- Working in remote or field locations
- Internet connectivity is intermittent or unavailable
- Need quick patient data entry
- Conducting outreach programs
- Require offline functionality
- Focus on individual patient encounters
- Need photo capture capability
