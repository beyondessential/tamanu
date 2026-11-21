//! The client for the actuator contract, `actuator/v1.openapi.yaml`.
//!
//! spec: SLPWK#actuator-contract

use std::{
	collections::BTreeMap,
	sync::atomic::{AtomicI64, Ordering},
	time::Duration,
};

use axum::http::{Method, StatusCode};
use serde::{Deserialize, Serialize};

use crate::{
	http::{Call, CallError, JsonClient, client, decode},
	state::{Part, Phase},
};

pub const TOKEN_HEADER: &str = "tamanu-lease-token";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Desired {
	Up,
	Down,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Observed {
	Starting,
	Ready,
	Stopping,
	Stopped,
	Failed,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct PartState {
	pub desired: Desired,
	pub observed: Observed,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct State {
	pub controls_parts: bool,
	pub upgrading: bool,
	#[serde(default)]
	pub parts: BTreeMap<Part, PartState>,
	pub lease: Option<LeaseInfo>,
	#[serde(default)]
	pub reports: BTreeMap<String, Report>,
}

impl State {
	pub fn all_observed(&self, parts: &[Part], want: Observed) -> bool {
		parts
			.iter()
			.all(|p| self.parts.get(p).is_some_and(|s| s.observed == want))
	}

	pub fn all_desired(&self, parts: &[Part], want: Desired) -> bool {
		parts
			.iter()
			.all(|p| self.parts.get(p).is_some_and(|s| s.desired == want))
	}

	fn pending(&self, parts: &[Part], want: Observed) -> (Vec<String>, Vec<String>) {
		let (mut waiting, mut failed) = (vec![], vec![]);
		for p in parts {
			match self.parts.get(p) {
				None => waiting.push(format!("{p:?} (not reported)")),
				Some(s) if s.observed == want => {}
				Some(s) if s.observed == Observed::Failed => failed.push(format!("{p:?}")),
				Some(s) => waiting.push(format!("{p:?} ({:?})", s.observed)),
			}
		}
		(waiting, failed)
	}
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LeaseInfo {
	pub holder: String,
	#[serde(default)]
	pub token: i64,
	pub expires_at: String,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct Announcement {
	pub token: i64,
	pub sequence: i64,
}

impl Announcement {
	pub fn after(&self, other: &Self) -> bool {
		(self.token, self.sequence) > (other.token, other.sequence)
	}

	pub fn is_zero(&self) -> bool {
		*self == Self::default()
	}
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Report {
	pub idle_seconds: f64,
	pub in_flight: usize,
	pub wake_requested: bool,
	#[serde(skip_serializing_if = "Option::is_none")]
	pub phase: Option<Phase>,
	#[serde(default)]
	pub announcement: Announcement,
	#[serde(default)]
	pub follows: Announcement,
	#[serde(default)]
	pub ttl_seconds: f64,
	#[serde(default, skip_serializing)]
	pub expires_at: Option<String>,
}

#[derive(Debug)]
pub enum Error {
	Call(CallError),
	/// The actuator refused a request for the lease.
	Conflict(Option<LeaseInfo>),
	Failed(Vec<String>),
	TimedOut(Vec<String>),
}

impl From<CallError> for Error {
	fn from(e: CallError) -> Self {
		Self::Call(e)
	}
}

impl std::fmt::Display for Error {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		match self {
			Self::Call(e) => write!(f, "actuator: {e}"),
			Self::Conflict(Some(l)) => write!(
				f,
				"actuator: the lease is held by {} until {}",
				l.holder, l.expires_at
			),
			Self::Conflict(None) => write!(f, "actuator: this supervisor does not hold the lease"),
			Self::Failed(parts) => write!(f, "{} failed", parts.join(", ")),
			Self::TimedOut(parts) => write!(f, "timed out waiting for {}", parts.join(", ")),
		}
	}
}

pub struct Client {
	base: String,
	credential: String,
	http: JsonClient,
	token: AtomicI64,
	pub request_timeout: Duration,
	pub poll_interval: Duration,
}

impl Client {
	pub fn new(base: &str, credential: &str) -> Self {
		Self {
			base: base.trim_end_matches('/').to_owned(),
			credential: credential.to_owned(),
			http: client(),
			token: AtomicI64::new(0),
			request_timeout: Duration::from_secs(10),
			poll_interval: Duration::from_secs(1),
		}
	}

	async fn call<T: serde::de::DeserializeOwned>(
		&self,
		method: Method,
		path: &str,
		body: Option<&impl Serialize>,
	) -> Result<Option<T>, Error> {
		let token = self.token.load(Ordering::Relaxed);
		let call = Call {
			method,
			url: format!("{}/v1/{path}", self.base),
			token: &self.credential,
			headers: if token > 0 {
				vec![(TOKEN_HEADER, token.to_string())]
			} else {
				vec![]
			},
			timeout: self.request_timeout,
		};
		let (status, body) = call.send(&self.http, body).await?;
		match status {
			StatusCode::CONFLICT => Err(Error::Conflict(decode(&body).ok())),
			StatusCode::NO_CONTENT => Ok(None),
			s if s.is_success() => Ok(Some(decode(&body)?)),
			s => Err(CallError::Status(s, body).into()),
		}
	}

	pub async fn state(&self) -> Result<State, Error> {
		Ok(self
			.call::<State>(Method::GET, "state", None::<&()>)
			.await?
			.unwrap_or_default())
	}

	/// Sets the desired state of the parts named, leaving the others. Needs the lease.
	pub async fn set(&self, parts: &BTreeMap<Part, Desired>) -> Result<State, Error> {
		let body = serde_json::json!({ "parts": parts });
		Ok(self
			.call::<State>(Method::PUT, "state", Some(&body))
			.await?
			.unwrap_or_default())
	}

	/// Polls until every part named is observed as `want`, one fails, or `timeout` passes.
	pub async fn await_parts(
		&self,
		parts: &[Part],
		want: Observed,
		timeout: Duration,
		mut seen: impl FnMut(&State),
	) -> Result<(), Error> {
		let deadline = tokio::time::Instant::now() + timeout;
		let mut last = State::default();
		loop {
			if let Ok(s) = self.state().await {
				seen(&s);
				let (waiting, failed) = s.pending(parts, want);
				if !failed.is_empty() {
					return Err(Error::Failed(failed));
				}
				if waiting.is_empty() {
					return Ok(());
				}
				last = s;
			}
			if tokio::time::Instant::now() + self.poll_interval > deadline {
				return Err(Error::TimedOut(last.pending(parts, want).0));
			}
			tokio::time::sleep(self.poll_interval).await;
		}
	}

	/// spec: SLPWK#actuator-contract
	pub async fn take_lease(&self, holder: &str, ttl: Duration) -> Result<LeaseInfo, Error> {
		let body = serde_json::json!({ "holder": holder, "ttlSeconds": ttl.as_secs_f64() });
		let lease = self
			.call::<LeaseInfo>(Method::POST, "lease", Some(&body))
			.await?
			.ok_or(Error::Conflict(None))?;
		self.token.store(lease.token, Ordering::Relaxed);
		Ok(lease)
	}

	pub async fn renew_lease(&self, holder: &str, ttl: Duration) -> Result<(), Error> {
		let body = serde_json::json!({ "holder": holder, "ttlSeconds": ttl.as_secs_f64() });
		self.call::<LeaseInfo>(Method::PUT, "lease", Some(&body))
			.await
			.map(drop)
	}

	pub async fn release_lease(&self) -> Result<(), Error> {
		let result = self
			.call::<serde_json::Value>(Method::DELETE, "lease", None::<&()>)
			.await;
		self.token.store(0, Ordering::Relaxed);
		result.map(drop)
	}

	pub async fn report(
		&self,
		instance: &str,
		mut report: Report,
		ttl: Duration,
	) -> Result<(), Error> {
		report.ttl_seconds = ttl.as_secs_f64();
		self.call::<serde_json::Value>(Method::PUT, &format!("reports/{instance}"), Some(&report))
			.await
			.map(drop)
	}
}
