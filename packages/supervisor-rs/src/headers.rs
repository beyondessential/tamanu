//! Security headers: helmet's set for the api's responses, and the apps' set for the web app and
//! patient portal.

use axum::http::{HeaderMap, HeaderName, HeaderValue};

/// helmet 8.1 with Tamanu's options, as the api sets them today.
const HELMET: &[(&str, &str)] = &[
	(
		"content-security-policy",
		"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests",
	),
	("cross-origin-embedder-policy", "require-corp"),
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

/// Not sent on the apps' own responses: the CSP is written per app, and the other two would break
/// a plain-HTTP deployment or cross-origin images.
const NOT_FOR_APPS: &[&str] = &["content-security-policy", "cross-origin-embedder-policy"];

/// Adds helmet's headers the api did not send itself.
pub fn api(headers: &mut HeaderMap) {
	headers.remove("x-powered-by");
	for (name, value) in HELMET {
		let name = HeaderName::from_static(name);
		if !headers.contains_key(&name) {
			headers.insert(name, HeaderValue::from_static(value));
		}
	}
}

/// Adds the apps' set to one of the frontend's own responses.
pub fn app(headers: &mut HeaderMap) {
	for (name, value) in HELMET.iter().filter(|(n, _)| !NOT_FOR_APPS.contains(n)) {
		headers.insert(
			HeaderName::from_static(name),
			HeaderValue::from_static(value),
		);
	}
	// TODO: each app's own CSP, written by using the app.
}
