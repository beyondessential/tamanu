# Plan: QR scan for mobile patient search

## Tech notes

- **Search input padding.** The scan button narrows the header search box. `SearchInput` (`packages/mobile/App/ui/components/SearchInput`) has left padding only, so text runs into the right edge. Give it matching right padding and truncate the placeholder and value on one line with an ellipsis. Losing the end of the placeholder on small screens is acceptable.
- **Error toast.** Mobile has no error toast. `ToastAndroid` is the plain native toast, and `Alert` (`packages/mobile/App/ui/components/Alert.tsx`) is an inline banner. Build a small error toast matching web's `CustomToastContainer` error style: `#fff0ee` background, alert-red text, small radius, close cross top-right, no icon. Make it reusable rather than specific to the scanner.
- **Camera dependency.** Mobile has no live camera scanning today (`react-native-image-picker` only) and the Android manifest has no `CAMERA` permission. A native camera library with QR code scanning, plus the permission, is needed.
