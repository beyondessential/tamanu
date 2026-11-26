//! The security headers on the frontend's own responses.
//!
//! spec: SUPV#security-headers

use std::sync::LazyLock;

use axum::http::{HeaderMap, HeaderName, HeaderValue};
use http_security_headers::{
	ContentSecurityPolicy, CrossOriginOpenerPolicy, CrossOriginResourcePolicy, PermissionsPolicy,
	SecurityHeaders,
};

/// Every security header, rendered once.
static APP: LazyLock<Vec<(HeaderName, HeaderValue)>> = LazyLock::new(|| {
	SecurityHeaders::builder()
		.content_security_policy_report_only(csp())
		.cross_origin_opener_policy(CrossOriginOpenerPolicy::SameOrigin)
		.cross_origin_resource_policy(CrossOriginResourcePolicy::SameOrigin)
		.permissions_policy(permissions_policy())
		.referrer_policy_no_referrer()
		.x_content_type_options_nosniff()
		.x_frame_options_sameorigin()
		.build()
		.expect("the security headers are valid")
		.header_pairs()
		.iter()
		.map(|(name, value)| {
			(
				HeaderName::from_static(name),
				HeaderValue::try_from(value).expect("the security headers are valid"),
			)
		})
		.collect()
});

/// The content security policy for the web app and the patient portal, sent report-only: a
/// browser lists in its console what the policy would block, and blocks nothing.
///
/// - Styles allow inline: the apps' style libraries insert `<style>` elements as they render.
/// - Workers, frames and images allow `blob:`: PDFs are rendered in workers and printed through
///   frames, from object URLs.
/// - Connections go to the server itself, the websocket included.
fn csp() -> ContentSecurityPolicy {
	ContentSecurityPolicy::new()
		.default_src(["'self'"])
		.base_uri(["'self'"])
		.object_src(["'none'"])
		.frame_ancestors(["'self'"])
		.form_action(["'self'"])
		.script_src(["'self'"])
		.directive("script-src-attr", ["'none'"])
		.style_src(["'self'", "'unsafe-inline'"])
		.img_src(["'self'", "data:", "blob:"])
		.font_src(["'self'", "data:"])
		.directive("worker-src", ["'self'", "blob:"])
		.frame_src(["'self'", "blob:"])
		.connect_src(["'self'"])
}

/// The camera is the apps' own, for scanning codes and taking photos; the other powerful features
/// are refused.
fn permissions_policy() -> PermissionsPolicy {
	PermissionsPolicy::new()
		.self_only("camera")
		.deny("display-capture")
		.deny("geolocation")
		.deny("microphone")
		.deny("payment")
		.deny("usb")
}

/// Sets the security headers on one of the frontend's own responses.
pub fn app(headers: &mut HeaderMap) {
	for (name, value) in APP.iter() {
		headers.insert(name, value.clone());
	}
}
