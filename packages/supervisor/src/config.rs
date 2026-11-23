//! The frontend mode's configuration, from the environment, with every problem reported at once.
//!
//! spec: SUPV#configuration

use std::{collections::BTreeMap, fmt, net::SocketAddr, path::PathBuf};

/// Where a frontend is served from, and on which addresses.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Frontend {
	pub binds: Vec<Bind>,
	pub root: PathBuf,
}

/// An address to listen on.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Bind {
	/// A port on every address, IPv6 and IPv4 alike.
	Any(u16),
	/// One address and port.
	Addr(SocketAddr),
}

/// As written in `BIND_ADDRESS`.
impl fmt::Display for Bind {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		match self {
			Self::Any(port) => write!(f, ":{port}"),
			Self::Addr(addr) => write!(f, "{addr}"),
		}
	}
}

/// Every problem found, as the variable's name and what is wrong with it.
#[derive(Debug, Default, PartialEq, Eq)]
pub struct Problems(pub Vec<(&'static str, String)>);

impl fmt::Display for Problems {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		for (name, problem) in &self.0 {
			writeln!(f, "{name}: {problem}")?;
		}
		Ok(())
	}
}

impl std::error::Error for Problems {}

/// The variables the frontend mode reads.
const VARIABLES: [&str; 2] = ["BIND_ADDRESS", "FRONTEND_ROOT"];

const DEFAULT_BIND: &str = ":3000";

#[cfg(windows)]
const DEFAULT_ROOT: &str = r"C:\app";
#[cfg(not(windows))]
const DEFAULT_ROOT: &str = "/app";

impl Frontend {
	/// Reads the configuration from the process's environment. Only its own variables are read,
	/// so another that is not valid Unicode is no concern of the supervisor's.
	pub fn from_env() -> Result<Self, Problems> {
		let mut vars = BTreeMap::new();
		let mut unreadable = Problems::default();
		for name in VARIABLES {
			match std::env::var(name) {
				Ok(value) => {
					vars.insert(name.to_owned(), value);
				}
				Err(std::env::VarError::NotUnicode(_)) => {
					unreadable.0.push((name, "is not valid Unicode".into()));
				}
				Err(std::env::VarError::NotPresent) => {}
			}
		}
		match Self::from_vars(&vars) {
			Ok(config) if unreadable.0.is_empty() => Ok(config),
			Ok(_) => Err(unreadable),
			Err(mut problems) => {
				problems.0.extend(unreadable.0);
				Err(problems)
			}
		}
	}

	/// Reads the configuration from `vars`, where an empty value counts as unset.
	pub fn from_vars(vars: &BTreeMap<String, String>) -> Result<Self, Problems> {
		let get = |name: &str| vars.get(name).map(|v| v.trim()).filter(|v| !v.is_empty());
		let mut problems = Problems::default();

		let mut binds = Vec::new();
		for addr in get("BIND_ADDRESS").unwrap_or(DEFAULT_BIND).split(',') {
			match parse_bind(addr.trim()) {
				Ok(bind) => binds.push(bind),
				Err(problem) => problems.0.push(("BIND_ADDRESS", problem)),
			}
		}
		let root = PathBuf::from(get("FRONTEND_ROOT").unwrap_or(DEFAULT_ROOT));

		if problems.0.is_empty() {
			Ok(Self { binds, root })
		} else {
			Err(problems)
		}
	}
}

/// Parses `host:port`, `[v6]:port` or `:port`.
fn parse_bind(addr: &str) -> Result<Bind, String> {
	if let Some(port) = addr.strip_prefix(':') {
		return port
			.parse()
			.map(Bind::Any)
			.map_err(|_| format!("{addr:?} does not end in a port"));
	}
	addr.parse().map(Bind::Addr).map_err(|_| {
		format!("{addr:?} is not an address and port, such as 127.0.0.1:3000 or :3000")
	})
}

#[cfg(test)]
mod tests {
	use super::*;

	fn vars(pairs: &[(&str, &str)]) -> BTreeMap<String, String> {
		pairs
			.iter()
			.map(|(k, v)| (k.to_string(), v.to_string()))
			.collect()
	}

	/// An environment, and the configuration or problems it gives.
	type Case = (
		&'static [(&'static str, &'static str)],
		Result<Frontend, Problems>,
	);

	#[test]
	fn frontend() {
		let cases: &[Case] = &[
			(
				&[],
				Ok(Frontend {
					binds: vec![Bind::Any(3000)],
					root: DEFAULT_ROOT.into(),
				}),
			),
			(
				&[("BIND_ADDRESS", " "), ("FRONTEND_ROOT", "")],
				Ok(Frontend {
					binds: vec![Bind::Any(3000)],
					root: DEFAULT_ROOT.into(),
				}),
			),
			(
				&[
					("BIND_ADDRESS", "127.0.0.1:3000,[::1]:3000"),
					("FRONTEND_ROOT", "/srv/web"),
				],
				Ok(Frontend {
					binds: vec![
						Bind::Addr("127.0.0.1:3000".parse().unwrap()),
						Bind::Addr("[::1]:3000".parse().unwrap()),
					],
					root: "/srv/web".into(),
				}),
			),
			(
				&[("BIND_ADDRESS", ":8000, 10.0.0.1:80")],
				Ok(Frontend {
					binds: vec![Bind::Any(8000), Bind::Addr("10.0.0.1:80".parse().unwrap())],
					root: DEFAULT_ROOT.into(),
				}),
			),
			(
				&[("BIND_ADDRESS", "localhost:3000,:http,:3000")],
				Err(Problems(vec![
					(
						"BIND_ADDRESS",
						"\"localhost:3000\" is not an address and port, such as 127.0.0.1:3000 or :3000".into(),
					),
					("BIND_ADDRESS", "\":http\" does not end in a port".into()),
				])),
			),
		];
		for (env, want) in cases {
			assert_eq!(&Frontend::from_vars(&vars(env)), want, "{env:?}");
		}
	}
}
