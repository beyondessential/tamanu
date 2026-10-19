# Plan: QR scan for mobile patient search

## Tech notes

- **Search input padding.** The scan button narrows the header search box. `SearchInput` (`packages/mobile/App/ui/components/SearchInput`) has left padding only, so text runs into the right edge. Give it matching right padding and truncate the placeholder and value on one line with an ellipsis. Losing the end of the placeholder on small screens is acceptable.
- **Camera dependency.** Mobile has no live camera scanning today (`react-native-image-picker` only) and the Android manifest has no `CAMERA` permission. A native camera library with QR code scanning, plus the permission, is needed.
