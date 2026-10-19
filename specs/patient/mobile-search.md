---
id: MPSRCH
---

# Mobile patient search

How staff find a patient in the mobile app, by typing in the search box or by scanning the QR code on a patient's ID card. The QR code holds the patient's NHN (display ID).

## Search

- [ ] The patient search screen has a search box in its header and two tabs, Recently viewed and All patients
- [ ] Text in the search box matches patients whose NHN, first name, middle name, last name or cultural name contains it
- [ ] The search applies to the All patients tab, together with any active filters
- [ ] The search box has even padding on both sides. When space is short, its text stays on one line and is cut off with an ellipsis

## Scan button

- [ ] A scan button with a QR code icon sits to the right of the search box in the patient search header
- [ ] The scan button is labelled "Scan QR code" for screen readers

## Scanner

- [ ] Tapping the scan button opens a full-screen scanner showing the rear camera, a guide frame and the prompt "Point the camera at the patient's QR code"
- [ ] The scanner reads a QR code as soon as one is in view, with no button to press
- [ ] A close button returns to patient search with the search box, filters and tab unchanged

## Validating the scanned code

- [ ] Spaces at the start and end of the scanned text are removed before checking
- [ ] A code is valid when it is no longer than 50 characters and matches the display ID format setting
- [ ] When no display ID format is set, any code up to 50 characters is valid
- [ ] When the display ID format setting is not a usable pattern, no code is valid

## After a valid scan

- [ ] The scanner closes
- [ ] The scanned NHN replaces any text in the search box
- [ ] Active filters are cleared
- [ ] The All patients tab opens, showing the patients that match the NHN

## After an invalid scan

- [ ] The scanner closes and an error toast below the header says "Not a valid QR code"
- [ ] The error toast looks the same as Tamanu's error toasts on web
- [ ] The error toast closes when tapped, or on its own after a few seconds
- [ ] The search box, filters and tab stay as they were

## Camera access

- [ ] The first time the scanner opens, the device asks for permission to use the camera
- [ ] When camera access is denied, the scanner says "Tamanu needs camera access to scan QR codes." and shows an Open settings button
- [ ] Open settings opens Tamanu's page in the device settings
- [ ] Returning to the scanner after allowing camera access shows the camera
