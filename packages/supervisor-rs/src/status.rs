//! The status server, on loopback: `/status`, `/health` and `/ready`.
//!
//! spec: SUPV#status

use std::{collections::BTreeMap, sync::Arc, time::Duration};

use axum::{
	Json, Router,
	extract::State,
	http::{HeaderValue, StatusCode, header},
	response::{IntoResponse, Response},
	routing::get,
};
use serde::Serialize;

use crate::{
	actuator::Announcement,
	buildinfo,
	machine::Machine,
	state::{Failure, Part, Phase, Server},
};

pub struct Status {
	pub state: Arc<Server>,
	pub machine: Option<Arc<Machine>>,
	pub idle_time: Duration,
	pub instance: String,
}

impl Status {
	fn ready(&self) -> bool {
		self.machine.as_ref().is_none_or(|m| m.ready())
	}
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Report {
	state: Phase,
	parts: BTreeMap<Part, PartStatus>,
	upgrading: bool,
	last_failure: Option<Failure>,
	in_flight: usize,
	idle_seconds: Option<f64>,
	idle_time: String,
	can_sleep: bool,
	release: &'static str,
	#[serde(skip_serializing_if = "Option::is_none")]
	lease: Option<&'static str>,
	#[serde(skip_serializing_if = "Option::is_none")]
	announcement: Option<Announcement>,
	instance: String,
	ready: bool,
}

#[derive(Serialize)]
struct PartStatus {
	ready: bool,
}

pub fn router(status: Status) -> Router {
	Router::new()
		.route("/status", get(report))
		.route(
			"/health",
			get(|| async { no_store(Json(serde_json::json!({ "status": "ok" }))) }),
		)
		.route("/ready", get(ready))
		.with_state(Arc::new(status))
}

fn no_store(body: impl IntoResponse) -> Response {
	let mut res = body.into_response();
	res.headers_mut()
		.insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
	res
}

async fn ready(State(status): State<Arc<Status>>) -> Response {
	tracing::debug!("ready");
	let ready = status.ready();
	let code = if ready {
		StatusCode::OK
	} else {
		StatusCode::SERVICE_UNAVAILABLE
	};
	no_store((code, Json(serde_json::json!({ "ready": ready }))))
}

async fn report(State(status): State<Arc<Status>>) -> Response {
	let snap = status.state.snapshot();
	let machine = status.machine.as_ref();
	no_store(Json(Report {
		state: snap.phase,
		parts: snap
			.ready
			.iter()
			.map(|(p, r)| (*p, PartStatus { ready: *r }))
			.collect(),
		upgrading: snap.upgrading,
		last_failure: snap.last_failure,
		in_flight: snap.in_flight,
		idle_seconds: (snap.in_flight == 0).then(|| snap.last_activity.elapsed().as_secs_f64()),
		idle_time: format!("{:?}", status.idle_time),
		can_sleep: machine.is_some_and(|m| m.controls_parts()),
		release: buildinfo::VERSION,
		lease: machine.map(|m| {
			if m.holds_lease() {
				"holder"
			} else {
				"follower"
			}
		}),
		announcement: machine.map(|m| m.announcement()),
		instance: status.instance.clone(),
		ready: status.ready(),
	}))
}
