//! What a supervisor shares with the others through the actuator: announcements, reports, and
//! following the holder.

use std::{
	collections::BTreeMap,
	sync::{Arc, atomic::Ordering},
	time::{Duration, Instant},
};

use tokio_util::sync::CancellationToken;

use crate::{
	actuator::{self, Announcement, Desired, Observed},
	machine::{Ann, Machine, StepError},
	state::Phase,
};

impl Machine {
	/// Moves the server to `phase` and, if the phase changed or this holder has not announced under
	/// its token yet, makes a new announcement and reports it at once.
	///
	/// spec: SLPWK#actuator-contract
	pub(crate) fn announce(&self, phase: Phase) {
		self.st.set_phase(phase);
		let token = self.token.load(Ordering::Relaxed);
		let mut ann = self.ann.lock().unwrap();
		let ours = ann.id.token == token;
		if ours && ann.phase == Some(phase) {
			return;
		}
		let sequence = if ours { ann.id.sequence + 1 } else { 1 };
		*ann = Ann {
			phase: Some(phase),
			id: Announcement { token, sequence },
		};
		drop(ann);
		self.report_now.notify_one();
	}

	/// Reads the actuator's state for as long as the machine runs. While the actuator cannot be
	/// reached, a follower keeps to the last phase and readiness it saw.
	///
	/// spec: SLPWK#waking
	pub(crate) async fn poll_actuator(self: Arc<Self>, root: CancellationToken) {
		let mut failing = false;
		let mut received = BTreeMap::new();
		loop {
			let asked = Instant::now();
			match self.act.state().await {
				Ok(s) => {
					failing = false;
					self.seen.store(true, Ordering::Relaxed);
					received = self.receive(&s, received);
					let s = Arc::new(s);
					*self.latest.lock().unwrap() = Some(s.clone());
					self.observe(&s, asked);
					let role = self.role.lock().unwrap();
					let holding = self.holding.load(Ordering::Relaxed);
					if !holding {
						self.follow(&s);
					}
					drop(role);
					if holding {
						self.take_wake_requests(&s);
						self.polled.notify_one();
					}
				}
				Err(error) if !failing => {
					tracing::warn!(%error, "reading the actuator's state");
					failing = true;
				}
				Err(_) => {}
			}
			tokio::select! {
				_ = root.cancelled() => return,
				_ = tokio::time::sleep(self.cfg.timing.actuator_poll) => {}
			}
		}
	}

	/// Takes the phase from the holder's newest announcement, and each part's readiness from the
	/// actuator. While awake every part counts as ready, as it does for the holder.
	fn follow(&self, s: &actuator::State) {
		if !self.controls_parts() {
			self.st.set_all_ready(true);
			self.st.set_phase(Phase::Awake);
			return;
		}
		self.follow_phase(s);
		if self.st.snapshot().phase == Phase::Awake {
			self.st.set_all_ready(true);
			return;
		}
		for p in &self.cfg.parts {
			self.st.set_ready(
				*p,
				s.parts
					.get(p)
					.is_some_and(|ps| ps.observed == Observed::Ready),
			);
		}
	}

	fn follow_phase(&self, s: &actuator::State) {
		if let Some(lease) = s.lease.as_ref().filter(|l| l.holder != self.cfg.instance) {
			if let Some(r) = s
				.reports
				.get(&lease.holder)
				.filter(|r| !r.announcement.is_zero())
			{
				let mut ann = self.ann.lock().unwrap();
				if r.announcement.after(&ann.id) {
					*ann = Ann {
						phase: r.phase,
						id: r.announcement,
					};
					drop(ann);
					if let Some(phase) = r.phase {
						self.st.set_phase(phase);
					}
					self.report_now.notify_one();
				}
				return;
			}
		}
		if self.announcement().is_zero() {
			let parts = &self.cfg.parts;
			self.st
				.set_phase(if s.all_observed(parts, Observed::Ready) {
					Phase::Awake
				} else if s.all_desired(parts, Desired::Down) {
					Phase::Asleep
				} else {
					Phase::Waking
				});
		}
	}

	/// Asks the holder for a wake when another supervisor reports one pending.
	///
	/// spec: SLPWK#waking
	fn take_wake_requests(&self, s: &actuator::State) {
		if self.ann.lock().unwrap().phase == Some(Phase::Awake) {
			return;
		}
		if s.reports
			.iter()
			.any(|(i, r)| *i != self.cfg.instance && r.wake_requested)
		{
			self.st.request_wake();
		}
	}

	/// Records when each other supervisor last saw activity, counting its report's idle time back
	/// from when this supervisor first read the report, never by the reporter's clock.
	fn receive(
		&self,
		s: &actuator::State,
		before: BTreeMap<String, (Option<String>, Instant)>,
	) -> BTreeMap<String, (Option<String>, Instant)> {
		let now = Instant::now();
		let mut received = BTreeMap::new();
		let mut activity = BTreeMap::new();
		for (instance, r) in s.reports.iter().filter(|(i, _)| **i != self.cfg.instance) {
			let seen = match before.get(instance) {
				Some((expires, at)) if *expires == r.expires_at => (expires.clone(), *at),
				_ => (r.expires_at.clone(), now),
			};
			activity.insert(
				instance.clone(),
				seen.1 - Duration::from_secs_f64(r.idle_seconds),
			);
			received.insert(instance.clone(), seen);
		}
		*self.activity.lock().unwrap() = activity;
		received
	}

	/// The other supervisors' latest activity, and how many requests they have in flight.
	///
	/// spec: SLPWK#activity
	pub(crate) fn others(&self) -> (Option<Instant>, usize) {
		let Some(s) = self.latest.lock().unwrap().clone() else {
			return (None, 0);
		};
		let activity = self.activity.lock().unwrap();
		let others = s.reports.iter().filter(|(i, _)| **i != self.cfg.instance);
		let last = others
			.clone()
			.filter_map(|(i, _)| activity.get(i).copied())
			.max();
		(last, others.map(|(_, r)| r.in_flight).sum())
	}

	/// Waits until every supervisor reporting follows the current announcement with nothing in
	/// flight, as must this one.
	///
	/// spec: SLPWK#going-to-sleep
	pub(crate) async fn settle(&self) -> Result<(), StepError> {
		let id = self.announcement();
		let deadline = tokio::time::Instant::now() + self.cfg.timing.settle_timeout;
		loop {
			let waiting = self.unsettled(id);
			if waiting.is_empty() {
				if let (Some(last), _) = self.others() {
					if last.elapsed() < self.cfg.timing.idle_time {
						return Err(StepError::Busy(format!(
							"another supervisor saw activity {:?} ago",
							last.elapsed()
						)));
					}
				}
				return Ok(());
			}
			tokio::select! {
				_ = tokio::time::sleep_until(deadline) => {
					return Err(StepError::Failed(format!(
						"supervisors still busy or behind: {}",
						waiting.join(", ")
					)));
				}
				_ = self.polled.notified() => {}
				_ = self.st.activity.notified() => {}
			}
		}
	}

	fn unsettled(&self, id: Announcement) -> Vec<String> {
		let mut waiting = vec![];
		let in_flight = self.st.snapshot().in_flight;
		if in_flight > 0 {
			waiting.push(format!("{} ({in_flight} in flight)", self.cfg.instance));
		}
		let Some(s) = self.latest.lock().unwrap().clone() else {
			return waiting;
		};
		for (instance, r) in s.reports.iter().filter(|(i, _)| **i != self.cfg.instance) {
			if r.follows != id {
				waiting.push(format!(
					"{instance} (following {}/{})",
					r.follows.token, r.follows.sequence
				));
			} else if r.in_flight > 0 {
				waiting.push(format!("{instance} ({} in flight)", r.in_flight));
			}
		}
		waiting
	}

	/// Sends this supervisor's report until the machine stops: on every tick, on a new
	/// announcement, and while not awake, as soon as a wake is asked for or the last request in
	/// flight finishes.
	///
	/// spec: SLPWK#actuator-contract
	pub(crate) async fn report(self: Arc<Self>, root: CancellationToken) {
		let mut failing = false;
		loop {
			match self
				.act
				.report(
					&self.cfg.instance,
					self.own_report(),
					self.cfg.timing.report_ttl,
				)
				.await
			{
				Ok(()) => failing = false,
				Err(error) if !failing => {
					tracing::warn!(%error, "reporting to the actuator");
					failing = true;
				}
				Err(_) => {}
			}
			let due = async {
				loop {
					self.st.report_due.notified().await;
					if self.st.snapshot().phase != Phase::Awake {
						return;
					}
				}
			};
			tokio::select! {
				_ = root.cancelled() => return,
				_ = tokio::time::sleep(self.cfg.timing.report_every) => {}
				_ = self.report_now.notified() => {}
				_ = due => {}
			}
		}
	}

	fn own_report(&self) -> actuator::Report {
		let ann = *self.ann.lock().unwrap();
		let snap = self.st.snapshot();
		let holding = self.holds_lease();
		actuator::Report {
			idle_seconds: snap.last_activity.elapsed().as_secs_f64(),
			in_flight: snap.in_flight,
			wake_requested: snap.wake_pending,
			phase: if holding { ann.phase } else { None },
			announcement: if holding {
				ann.id
			} else {
				Announcement::default()
			},
			follows: ann.id,
			..Default::default()
		}
	}
}
