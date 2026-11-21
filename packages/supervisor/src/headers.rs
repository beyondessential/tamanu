//! The security headers on the frontend's own responses.
//!
//! spec: SUPV#security-headers

use axum::http::{HeaderMap, HeaderName, HeaderValue};

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

/// Sets the security headers on one of the frontend's own responses.
pub fn app(headers: &mut HeaderMap) {
	for (name, value) in APP {
		headers.insert(
			HeaderName::from_static(name),
			HeaderValue::from_static(value),
		);
	}
}
