//! The client for the api's supervisor routes, under `/api/supervisor`.
//!
//! spec: SUPV#talking-to-the-server

use std::time::Duration;

use axum::http::{Method, StatusCode};
use serde::Deserialize;

use crate::http::{Call, CallError, JsonClient, client, decode};

pub struct Client {
	upstreams: Vec<String>,
	token: String,
	http: JsonClient,
	pub call_timeout: Duration,
	pub final_sync_timeout: Duration,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskHold {
	pub busy: bool,
	#[serde(default)]
	pub running_tasks: Vec<String>,
	#[serde(default)]
	pub fhir_jobs: usize,
}

#[derive(Debug, Default, Deserialize)]
pub struct FinalSync {
	pub completed: bool,
	#[serde(default)]
	pub reason: String,
}

impl Client {
	pub fn new(upstreams: &[String], token: &str) -> Self {
		Self {
			upstreams: upstreams.to_vec(),
			token: token.to_owned(),
			http: client(),
			call_timeout: Duration::from_secs(30),
			final_sync_timeout: Duration::from_secs(15 * 60),
		}
	}

	/// spec: SLPWK#going-to-sleep
	pub async fn hold_tasks(&self) -> Result<TaskHold, CallError> {
		self.call(Method::POST, "tasks/hold", self.call_timeout)
			.await
	}

	pub async fn release_tasks(&self) -> Result<(), CallError> {
		self.call::<serde_json::Value>(Method::DELETE, "tasks/hold", self.call_timeout)
			.await
			.map(drop)
	}

	pub async fn version(&self) -> Result<String, CallError> {
		#[derive(Default, Deserialize)]
		struct Status {
			version: String,
		}
		let status: Status = self.call(Method::GET, "status", self.call_timeout).await?;
		Ok(status.version)
	}

	pub async fn final_sync(&self) -> Result<FinalSync, CallError> {
		self.call(Method::POST, "final-sync", self.final_sync_timeout)
			.await
	}

	/// Calls the first instance that answers. One that cannot be reached, does not answer in time
	/// or fails on its own side is passed over, which is safe because every supervisor route can
	/// be repeated.
	async fn call<T: serde::de::DeserializeOwned + Default>(
		&self,
		method: Method,
		route: &str,
		timeout: Duration,
	) -> Result<T, CallError> {
		let mut last = CallError::Unreachable("no api addresses configured".into());
		for upstream in &self.upstreams {
			let call = Call {
				method: method.clone(),
				url: format!("http://{upstream}/api/supervisor/{route}"),
				token: &self.token,
				headers: vec![],
				timeout,
			};
			match call.send(&self.http, None::<&()>).await {
				Ok((status, body)) if status.is_success() => {
					return if body.is_empty() {
						Ok(T::default())
					} else {
						decode(&body)
					};
				}
				Ok((status, body)) if status < StatusCode::INTERNAL_SERVER_ERROR => {
					return Err(CallError::Status(status, body));
				}
				Ok((status, body)) => last = CallError::Status(status, body),
				Err(e) => last = e,
			}
		}
		Err(last)
	}
}
