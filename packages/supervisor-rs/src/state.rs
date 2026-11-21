//! The supervisor's run-time view of its server. The gate reads it for every request and the
//! sleep and wake machine writes it.

use std::{
	collections::BTreeMap,
	sync::{Arc, Mutex},
	time::{Instant, SystemTime},
};

use serde::Serialize;
use tokio::sync::Notify;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, serde::Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Phase {
	Awake,
	GoingToSleep,
	Asleep,
	Waking,
}

/// One of the server's parts, as the actuator contract names them.
///
/// spec: SLPWK#going-to-sleep
#[derive(
	Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, serde::Deserialize,
)]
#[serde(rename_all = "lowercase")]
pub enum Part {
	Database,
	Api,
	Sync,
	Tasks,
	Fhir,
}

pub const PARTS: [Part; 5] = [
	Part::Database,
	Part::Api,
	Part::Sync,
	Part::Tasks,
	Part::Fhir,
];

/// What the gate does with a request.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Admission {
	Forward,
	Hold,
	Upgrading,
}

#[derive(Debug, Clone, Serialize)]
pub struct Failure {
	pub at: SystemTime,
	pub message: String,
}

#[derive(Debug)]
struct Inner {
	phase: Phase,
	ready: BTreeMap<Part, bool>,
	upgrading: bool,
	in_flight: usize,
	last_activity: Instant,
	last_failure: Option<Failure>,
	wake_pending: bool,
}

/// The run-time state of one server. A new one is awake with every part ready.
#[derive(Debug)]
pub struct Server {
	inner: Mutex<Inner>,
	pub wake: Notify,
	pub activity: Notify,
	pub report_due: Notify,
}

/// Ends a request's activity when dropped.
pub struct InFlight(Arc<Server>);

impl Drop for InFlight {
	fn drop(&mut self) {
		let mut inner = self.0.inner.lock().unwrap();
		inner.in_flight -= 1;
		inner.last_activity = Instant::now();
		self.0.activity.notify_one();
		if inner.in_flight == 0 {
			self.0.report_due.notify_one();
		}
	}
}

#[derive(Debug, Clone)]
pub struct Snapshot {
	pub phase: Phase,
	pub ready: BTreeMap<Part, bool>,
	pub upgrading: bool,
	pub in_flight: usize,
	pub last_activity: Instant,
	pub last_failure: Option<Failure>,
	pub wake_pending: bool,
}

impl Server {
	pub fn new(parts: &[Part]) -> Arc<Self> {
		Arc::new(Self {
			inner: Mutex::new(Inner {
				phase: Phase::Awake,
				ready: parts.iter().map(|p| (*p, true)).collect(),
				upgrading: false,
				in_flight: 0,
				last_activity: Instant::now(),
				last_failure: None,
				wake_pending: false,
			}),
			wake: Notify::new(),
			activity: Notify::new(),
			report_due: Notify::new(),
		})
	}

	fn admit(inner: &Inner, part: Part) -> Admission {
		// spec: SLPWK#waking
		if inner.upgrading {
			Admission::Upgrading
		} else if matches!(inner.phase, Phase::Awake | Phase::Waking)
			&& inner.ready.get(&part) == Some(&true)
		{
			Admission::Forward
		} else {
			Admission::Hold
		}
	}

	pub fn admit_exempt(&self, part: Part) -> Admission {
		Self::admit(&self.inner.lock().unwrap(), part)
	}

	/// A request for one of the supervisor's own files, served in every state, counting as
	/// activity.
	///
	/// spec: SLPWK#waking
	pub fn admit_static(self: &Arc<Self>) -> InFlight {
		let mut inner = self.inner.lock().unwrap();
		inner.last_activity = Instant::now();
		self.activity.notify_one();
		if inner.phase != Phase::Awake && !inner.upgrading {
			self.request_wake_locked(&mut inner);
		}
		inner.in_flight += 1;
		InFlight(self.clone())
	}

	/// spec: SLPWK#activity
	pub fn admit_activity(self: &Arc<Self>, part: Part) -> (Admission, Option<InFlight>) {
		let mut inner = self.inner.lock().unwrap();
		let admission = Self::admit(&inner, part);
		inner.last_activity = Instant::now();
		self.activity.notify_one();
		match admission {
			Admission::Forward => {
				inner.in_flight += 1;
				(admission, Some(InFlight(self.clone())))
			}
			Admission::Hold => {
				self.request_wake_locked(&mut inner);
				(admission, None)
			}
			Admission::Upgrading => (admission, None),
		}
	}

	fn request_wake_locked(&self, inner: &mut Inner) {
		self.wake.notify_one();
		if !inner.wake_pending {
			inner.wake_pending = true;
			self.report_due.notify_one();
		}
	}

	pub fn request_wake(&self) {
		let mut inner = self.inner.lock().unwrap();
		self.request_wake_locked(&mut inner);
	}

	pub fn set_phase(&self, phase: Phase) {
		let mut inner = self.inner.lock().unwrap();
		inner.phase = phase;
		if phase == Phase::Awake {
			inner.wake_pending = false;
		}
	}

	pub fn set_ready(&self, part: Part, ready: bool) {
		if let Some(r) = self.inner.lock().unwrap().ready.get_mut(&part) {
			*r = ready;
		}
	}

	pub fn set_all_ready(&self, ready: bool) {
		for r in self.inner.lock().unwrap().ready.values_mut() {
			*r = ready;
		}
	}

	pub fn set_upgrading(&self, upgrading: bool) {
		self.inner.lock().unwrap().upgrading = upgrading;
	}

	pub fn set_failure(&self, message: Option<String>) {
		self.inner.lock().unwrap().last_failure = message.map(|message| Failure {
			at: SystemTime::now(),
			message,
		});
	}

	pub fn snapshot(&self) -> Snapshot {
		let inner = self.inner.lock().unwrap();
		Snapshot {
			phase: inner.phase,
			ready: inner.ready.clone(),
			upgrading: inner.upgrading,
			in_flight: inner.in_flight,
			last_activity: inner.last_activity,
			last_failure: inner.last_failure.clone(),
			wake_pending: inner.wake_pending,
		}
	}
}
