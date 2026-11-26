// The family registerFonts registers and languageContext selects under features.useGlobalPdfFont.
// Declared once because callers key behaviour off the name: the diet summary's page-break estimate
// picks a line height by comparing against it, and a rename that missed one would silently restore
// the wrapping-height mismatch it guards against.
export const GLOBAL_PDF_FONT = 'GlobalPdfFont';
export const GLOBAL_PDF_FONT_BOLD = `${GLOBAL_PDF_FONT}-Bold`;
