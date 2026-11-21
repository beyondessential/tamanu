//! Configuration from the environment, checked with every problem reported at once.
//!
//! spec: SUPV#configuration

use std::{
	collections::BTreeMap,
	env,
	net::{IpAddr, SocketAddr},
	path::PathBuf,
	time::Duration,
};

const PREFIX: &str = "TAMANU_SUPERVISOR_";
const KNOWN: &[&str] = &[
	"ROLE",
	"LISTEN",
	"PORTAL_LISTEN",
	"STATUS_LISTEN",
	"API_UPSTREAMS",
	"WEB_ROOT",
	"PORTAL_ROOT",
	"ACTUATOR_URL",
	"IDLE_TIME",
	"API_TOKEN",
	"TRUSTED_PROXIES",
	"LOG",
];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Role {
	Central,
	Facility,
}

/// The frontend mode's configuration: one built frontend, served alone.
#[derive(Debug, Clone)]
pub struct Frontend {
	pub binds: Vec<SocketAddr>,
	pub root: PathBuf,
}

#[derive(Debug, Clone)]
pub struct Supervisor {
	pub role: Role,
	pub listen: SocketAddr,
	pub portal: Option<(SocketAddr, PathBuf)>,
	pub status_listen: SocketAddr,
	pub api_upstreams: Vec<String>,
	pub web_root: PathBuf,
	pub actuator_url: Option<String>,
	pub idle_time: Duration,
	pub api_token: Option<String>,
	pub trusted_proxies: Vec<Cidr>,
}

/// Every problem found, as the variable's name and what is wrong with it.
#[derive(Debug, Default)]
pub struct Problems(Vec<(String, String)>);

impl Problems {
	fn add(&mut self, name: &str, problem: impl Into<String>) {
		self.0.push((name.to_owned(), problem.into()));
	}
}

impl std::fmt::Display for Problems {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		for (name, problem) in &self.0 {
			writeln!(f, "{name}: {problem}")?;
		}
		Ok(())
	}
}

/// The environment, with empty values counting as unset.
fn vars() -> BTreeMap<String, String> {
	env::vars().filter(|(_, v)| !v.trim().is_empty()).collect()
}

impl Frontend {
	pub fn from_env() -> Result<Self, Problems> {
		let vars = vars();
		let mut problems = Problems::default();
		let binds = vars
			.get("BIND_ADDRESS")
			.map(String::as_str)
			.unwrap_or(":3000")
			.split(',')
			.filter_map(|addr| {
				parse_addr(addr.trim())
					.map_err(|e| problems.add("BIND_ADDRESS", e))
					.ok()
			})
			.collect();
		let root = vars
			.get("FRONTEND_ROOT")
			.map(PathBuf::from)
			.unwrap_or_else(|| "/app".into());
		if problems.0.is_empty() {
			Ok(Self { binds, root })
		} else {
			Err(problems)
		}
	}
}

impl Supervisor {
	pub fn from_env() -> Result<Self, Problems> {
		let vars = vars();
		let mut problems = Problems::default();
		for name in vars.keys().filter_map(|k| k.strip_prefix(PREFIX)) {
			if !KNOWN.contains(&name) {
				problems.add(&format!("{PREFIX}{name}"), "is not a supervisor variable");
			}
		}
		let get = |name: &str| vars.get(&format!("{PREFIX}{name}")).cloned();
		let name = |name: &str| format!("{PREFIX}{name}");

		let role = match get("ROLE").as_deref() {
			Some("central") => Some(Role::Central),
			Some("facility") => Some(Role::Facility),
			Some(other) => {
				problems.add(
					&name("ROLE"),
					format!("must be central or facility, not {other:?}"),
				);
				None
			}
			None => {
				problems.add(&name("ROLE"), "is required");
				None
			}
		};
		let mut addr = |var: &str, default: &str| {
			parse_addr(&get(var).unwrap_or_else(|| default.into()))
				.map_err(|e| problems.add(&name(var), e))
				.ok()
		};
		let listen = addr("LISTEN", ":8080");
		let status_listen = addr("STATUS_LISTEN", "127.0.0.1:8081");
		let portal_listen = get("PORTAL_LISTEN").and_then(|a| {
			parse_addr(&a)
				.map_err(|e| problems.add(&name("PORTAL_LISTEN"), e))
				.ok()
		});
		let portal = match (portal_listen, get("PORTAL_ROOT")) {
			(Some(addr), Some(root)) => Some((addr, PathBuf::from(root))),
			(Some(_), None) => {
				problems.add(&name("PORTAL_ROOT"), "is required with PORTAL_LISTEN");
				None
			}
			_ => None,
		};
		let api_upstreams: Vec<String> = get("API_UPSTREAMS")
			.map(|v| v.split_whitespace().map(str::to_owned).collect())
			.unwrap_or_default();
		if api_upstreams.is_empty() {
			problems.add(&name("API_UPSTREAMS"), "is required");
		}
		let web_root = get("WEB_ROOT").map(PathBuf::from);
		if web_root.is_none() {
			problems.add(&name("WEB_ROOT"), "is required");
		}
		let actuator_url = get("ACTUATOR_URL");
		if let Some(url) = &actuator_url {
			if !url.starts_with("http://") {
				problems.add(&name("ACTUATOR_URL"), "must be an http:// URL");
			}
		}
		let api_token = get("API_TOKEN");
		if actuator_url.is_some() && api_token.is_none() {
			problems.add(&name("API_TOKEN"), "is required with ACTUATOR_URL");
		}
		let default_idle = if role == Some(Role::Central) {
			"15m"
		} else {
			"30m"
		};
		let idle_time = parse_duration(&get("IDLE_TIME").unwrap_or_else(|| default_idle.into()))
			.map_err(|e| problems.add(&name("IDLE_TIME"), e))
			.unwrap_or_default();
		let trusted_proxies = match get("TRUSTED_PROXIES") {
			Some(v) => v
				.split_whitespace()
				.filter_map(|c| {
					c.parse()
						.map_err(|e| problems.add(&name("TRUSTED_PROXIES"), e))
						.ok()
				})
				.collect(),
			None => {
				problems.add(&name("TRUSTED_PROXIES"), "is required");
				vec![]
			}
		};

		if !problems.0.is_empty() {
			return Err(problems);
		}
		Ok(Self {
			role: role.unwrap(),
			listen: listen.unwrap(),
			portal,
			status_listen: status_listen.unwrap(),
			api_upstreams,
			web_root: web_root.unwrap(),
			actuator_url,
			idle_time,
			api_token,
			trusted_proxies,
		})
	}
}

/// Parses `host:port` or `:port`.
fn parse_addr(addr: &str) -> Result<SocketAddr, String> {
	if let Some(port) = addr.strip_prefix(':') {
		let port: u16 = port
			.parse()
			.map_err(|_| format!("{addr:?} has no valid port"))?;
		return Ok(SocketAddr::from(([0, 0, 0, 0, 0, 0, 0, 0], port)));
	}
	addr.parse()
		.map_err(|_| format!("{addr:?} is not a host:port address"))
}

/// Parses a duration such as "30m", "1h30m" or "90s".
fn parse_duration(s: &str) -> Result<Duration, String> {
	let mut total = Duration::ZERO;
	let mut number = String::new();
	for c in s.chars() {
		if c.is_ascii_digit() {
			number.push(c);
			continue;
		}
		let n: u64 = number
			.parse()
			.map_err(|_| format!("{s:?} is not a duration"))?;
		number.clear();
		total += match c {
			'h' => Duration::from_secs(n * 3600),
			'm' => Duration::from_secs(n * 60),
			's' => Duration::from_secs(n),
			_ => return Err(format!("{s:?} is not a duration")),
		};
	}
	if !number.is_empty() || total.is_zero() {
		return Err(format!("{s:?} is not a duration"));
	}
	Ok(total)
}

/// An address range, for the trusted proxies.
#[derive(Debug, Clone, Copy)]
pub struct Cidr {
	addr: IpAddr,
	prefix: u8,
}

impl std::str::FromStr for Cidr {
	type Err = String;
	fn from_str(s: &str) -> Result<Self, String> {
		let (addr, prefix) = s.split_once('/').unwrap_or((s, ""));
		let addr: IpAddr = addr
			.parse()
			.map_err(|_| format!("{s:?} is not an address range"))?;
		let max = if addr.is_ipv4() { 32 } else { 128 };
		let prefix = if prefix.is_empty() {
			max
		} else {
			prefix
				.parse()
				.ok()
				.filter(|p| *p <= max)
				.ok_or(format!("{s:?} has a bad prefix"))?
		};
		Ok(Self { addr, prefix })
	}
}

impl Cidr {
	pub fn contains(&self, ip: IpAddr) -> bool {
		match (self.addr, ip.to_canonical()) {
			(IpAddr::V4(net), IpAddr::V4(ip)) => {
				mask(u32::from(net).into(), u32::from(ip).into(), self.prefix, 32)
			}
			(IpAddr::V6(net), IpAddr::V6(ip)) => {
				mask(u128::from(net), u128::from(ip), self.prefix, 128)
			}
			_ => false,
		}
	}
}

fn mask(net: u128, ip: u128, prefix: u8, bits: u32) -> bool {
	if prefix == 0 {
		return true;
	}
	let shift = bits - u32::from(prefix);
	(net >> shift) == (ip >> shift)
}
