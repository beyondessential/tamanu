//! The security headers on the frontend's own responses.
//!
//! spec: SUPV#security-headers

use axum::http::{HeaderMap, HeaderName, HeaderValue, header};

/// helmet's headers, as the api sets them, but its content security policy and
/// `Cross-Origin-Embedder-Policy`.
const APP: &[(&str, &str)] = &[
	("cross-origin-opener-policy", "same-origin"),
	("cross-origin-resource-policy", "same-origin"),
	("origin-agent-cluster", "?1"),
	("referrer-policy", "no-referrer"),
	("x-content-type-options", "nosniff"),
	("x-dns-prefetch-control", "off"),
	("x-download-options", "noopen"),
	("x-frame-options", "SAMEORIGIN"),
	("x-permitted-cross-domain-policies", "none"),
	("x-xss-protection", "0"),
];

/// The content security policy for the web app and the patient portal, reported but not enforced:
/// a browser lists in its console what the policy would block, and blocks nothing.
///
/// - Styles allow inline: the apps' style libraries insert `<style>` elements as they render.
/// - Workers, frames and images allow `blob:`: PDFs are rendered in workers and printed through
///   frames, from object URLs.
/// - Connections go to the server itself, the websocket included, and to Bugsnag where it is
///   configured.
const CSP_REPORT_ONLY: &str = concat!(
	"default-src 'self'; ",
	"base-uri 'self'; ",
	"object-src 'none'; ",
	"frame-ancestors 'self'; ",
	"form-action 'self'; ",
	"script-src 'self'; ",
	"script-src-attr 'none'; ",
	"style-src 'self' 'unsafe-inline'; ",
	"img-src 'self' data: blob:; ",
	"font-src 'self' data:; ",
	"worker-src 'self' blob:; ",
	"frame-src 'self' blob:; ",
	"connect-src 'self' https://notify.bugsnag.com https://sessions.bugsnag.com ",
	"https://notify.bugsnag.smartbear.com https://sessions.bugsnag.smartbear.com",
);

/// Sets the security headers on one of the frontend's own responses.
pub fn app(headers: &mut HeaderMap) {
	for (name, value) in APP {
		headers.insert(
			HeaderName::from_static(name),
			HeaderValue::from_static(value),
		);
	}
	headers.insert(
		header::CONTENT_SECURITY_POLICY_REPORT_ONLY,
		HeaderValue::from_static(CSP_REPORT_ONLY),
	);
}
