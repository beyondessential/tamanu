# QR tester tool for VDS

This is a standalone tool expressly created for the thorough validation of VDS QR code data. These have complex and layered requirements, including data and cryptographic validation, all of which is tedious and error-prone to check by hand.

The tool checks:

- data at a coarse level (is this valid JSON?)
- data at a shape level (is this valid according to the VDS-NC JSON Schema?)
- cryptographic integrity (is the signature included in the code valid for the data against the included certificate?)
- cryptographic chain of trust (is the certificate included in the code valid against a given CSCA or masterlist?)

Usage-wise, this is a tiny website. It needs to be served over HTTPS for API purposes (in-browser crypto). That makes it a bit annoying to use for non-devs (and devs tbh) so it comes with an http server and its own self-signed certificate. The server opens up the website in the browser on start for good measure. Then the lot can be `pkg`'d up for win/mac/linux and run straight off the single bin. It attaches to `0.0.0.0` (all interfaces) so it's accessible from localhost but also from anything connected to the same LAN (e.g. a phone).

It runs entirely within the browser with no backend and no compiling done. Makes it pretty trivial to hack on. In the future, could be extended for the EUDCC work (even _more_ complicated layering!) or to check even more details.
