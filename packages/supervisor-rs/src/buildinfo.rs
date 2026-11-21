//! The Tamanu release the supervisor was built for.

/// The release, from `TAMANU_VERSION` at build time, or "dev" without it.
pub const VERSION: &str = match option_env!("TAMANU_VERSION") {
	Some(version) => version,
	None => DEV,
};

/// The version of a build that was not given one.
pub const DEV: &str = "dev";

/// The release line of `version`: its major and minor version, as "2.70" for "v2.70.3".
///
/// spec: SUPV#compatibility
pub fn line(version: &str) -> String {
	let version = version.trim().trim_start_matches('v');
	let mut parts = version.splitn(3, '.');
	match (parts.next(), parts.next()) {
		(Some(major), Some(minor)) => format!("{major}.{minor}"),
		_ => version.to_owned(),
	}
}

pub fn same_line(a: &str, b: &str) -> bool {
	line(a) == line(b)
}
