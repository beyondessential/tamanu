//! Puts the server to sleep when it goes quiet and wakes it when it is used. One task, `run`, owns
//! every transition; the gate reads the outcome from the shared state.
//!
//! spec: SLPWK#going-to-sleep
//! spec: SLPWK#waking

use std::{
	collections::BTreeMap,
	future::Future,
	sync::{
		Arc, Mutex,
		atomic::{AtomicBool, AtomicI64, Ordering},
	},
	time::{Duration, Instant},
};

use tokio::sync::Notify;
use tokio_util::sync::CancellationToken;

use crate::{
	actuator::{self, Announcement, Desired, Observed},
	apiclient, buildinfo,
	state::{Part, Phase, Server},
};

pub struct Timing {
	pub idle_time: Duration,
	pub busy_recheck: Duration,
	pub actuator_poll: Duration,
	pub part_timeout: Duration,
	pub wake_backoff: Duration,
	pub wake_backoff_max: Duration,
	pub lease_ttl: Duration,
	pub lease_renew: Duration,
	pub lease_retry: Duration,
	pub report_every: Duration,
	pub report_ttl: Duration,
	pub settle_timeout: Duration,
}

impl Timing {
	pub fn production(idle_time: Duration) -> Self {
		Self {
			idle_time,
			busy_recheck: Duration::from_secs(60),
			actuator_poll: Duration::from_secs(1),
			part_timeout: Duration::from_secs(600),
			wake_backoff: Duration::from_secs(5),
			wake_backoff_max: Duration::from_secs(120),
			lease_ttl: Duration::from_secs(30),
			lease_renew: Duration::from_secs(10),
			lease_retry: Duration::from_secs(2),
			report_every: Duration::from_secs(10),
			report_ttl: Duration::from_secs(30),
			settle_timeout: Duration::from_secs(60),
		}
	}
}

pub struct Config {
	pub central: bool,
	pub parts: Vec<Part>,
	pub release: &'static str,
	pub instance: String,
	pub timing: Timing,
}

#[derive(Debug)]
pub(crate) enum StepError {
	Busy(String),
	Activity,
	Upgrade,
	NotControlled,
	Cancelled,
	Failed(String),
}

impl<E: std::fmt::Display> From<E> for StepError {
	fn from(e: E) -> Self {
		Self::Failed(e.to_string())
	}
}

#[derive(Debug, Clone, Copy, Default)]
pub(crate) struct Ann {
	pub phase: Option<Phase>,
	pub id: Announcement,
}

pub struct Machine {
	pub(crate) cfg: Config,
	pub(crate) st: Arc<Server>,
	pub(crate) act: actuator::Client,
	api: apiclient::Client,

	/// Orders taking and giving up the lease against following.
	pub(crate) role: Mutex<Option<CancellationToken>>,
	pub(crate) holding: AtomicBool,
	retiring: AtomicBool,
	observed_asked: Mutex<Option<Instant>>,
	pub(crate) seen: AtomicBool,
	pub(crate) latest: Mutex<Option<Arc<actuator::State>>>,
	/// When each other supervisor last saw activity, by this supervisor's clock.
	pub(crate) activity: Mutex<BTreeMap<String, Instant>>,
	pub(crate) polled: Notify,
	pub(crate) ann: Mutex<Ann>,
	pub(crate) report_now: Notify,
	changed: Notify,
	pub(crate) controls: AtomicBool,
	upgrading: AtomicBool,
	pub(crate) token: AtomicI64,
	next_attempt: Mutex<Option<Instant>>,
	wake_failed: AtomicBool,
	dev_logged: AtomicBool,
}

/// Runs `fut` until `token` is cancelled, answering None if it was.
async fn within<T>(token: &CancellationToken, fut: impl Future<Output = T>) -> Option<T> {
	tokio::select! {
		_ = token.cancelled() => None,
		v = fut => Some(v),
	}
}

async fn sleep(token: &CancellationToken, d: Duration) -> bool {
	within(token, tokio::time::sleep(d)).await.is_some()
}

impl Machine {
	/// Until it has read the actuator's state, the server holds requests as for a waking one.
	pub fn new(
		cfg: Config,
		st: Arc<Server>,
		act: actuator::Client,
		api: apiclient::Client,
	) -> Arc<Self> {
		st.set_all_ready(false);
		st.set_phase(Phase::Waking);
		Arc::new(Self {
			cfg,
			st,
			act,
			api,
			role: Mutex::new(None),
			holding: AtomicBool::new(false),
			retiring: AtomicBool::new(false),
			observed_asked: Mutex::new(None),
			seen: AtomicBool::new(false),
			latest: Mutex::new(None),
			activity: Mutex::new(BTreeMap::new()),
			polled: Notify::new(),
			ann: Mutex::new(Ann::default()),
			report_now: Notify::new(),
			changed: Notify::new(),
			controls: AtomicBool::new(false),
			upgrading: AtomicBool::new(false),
			token: AtomicI64::new(0),
			next_attempt: Mutex::new(None),
			wake_failed: AtomicBool::new(false),
			dev_logged: AtomicBool::new(false),
		})
	}

	pub fn holds_lease(&self) -> bool {
		self.holding.load(Ordering::Relaxed)
	}

	pub fn ready(&self) -> bool {
		self.seen.load(Ordering::Relaxed)
	}

	pub fn controls_parts(&self) -> bool {
		self.controls.load(Ordering::Relaxed)
	}

	pub fn announcement(&self) -> Announcement {
		self.ann.lock().unwrap().id
	}

	/// Follows the holder, takes the lease when it is free, acts while it holds it, and follows
	/// again if it loses it.
	///
	/// spec: SUPV#resilience
	pub async fn run(self: Arc<Self>, root: CancellationToken) {
		let poll = tokio::spawn(self.clone().poll_actuator(root.clone()));
		let report = tokio::spawn(self.clone().report(root.clone()));
		while let Some(lease) = self.acquire(&root).await {
			let tenure = root.child_token();
			*self.role.lock().unwrap() = Some(tenure.clone());
			self.token.store(lease.token, Ordering::Relaxed);
			let keeper = tokio::spawn(self.clone().keep_lease(tenure.clone()));
			self.act_as_holder(&tenure).await;
			tenure.cancel();
			let _ = keeper.await;
			let mut role = self.role.lock().unwrap();
			self.holding.store(false, Ordering::Relaxed);
			*role = None;
		}
		let _ = tokio::join!(poll, report);
	}

	/// Gives up the lease at once and stops taking it again; the supervisor goes on following and
	/// passing traffic.
	///
	/// spec: SUPV#resilience
	pub async fn step_down(&self) {
		if self.retiring.swap(true, Ordering::Relaxed) {
			return;
		}
		let tenure = self.role.lock().unwrap().clone();
		if let Some(tenure) = tenure {
			tenure.cancel();
		}
		if self.holds_lease() {
			self.release_lease().await;
		}
	}

	async fn release_lease(&self) {
		match tokio::time::timeout(Duration::from_secs(5), self.act.release_lease()).await {
			Ok(Ok(())) => tracing::info!("released the actuator's lease"),
			Ok(Err(error)) => tracing::warn!(%error, "releasing the actuator's lease"),
			Err(_) => tracing::warn!("releasing the actuator's lease timed out"),
		}
	}

	async fn acquire(&self, root: &CancellationToken) -> Option<actuator::LeaseInfo> {
		let mut waiting = false;
		loop {
			if self.retiring.load(Ordering::Relaxed) {
				root.cancelled().await;
				return None;
			}
			match within(
				root,
				self.act
					.take_lease(&self.cfg.instance, self.cfg.timing.lease_ttl),
			)
			.await?
			{
				Ok(lease) => {
					self.holding.store(true, Ordering::Relaxed);
					if self.retiring.load(Ordering::Relaxed) {
						self.release_lease().await;
						self.holding.store(false, Ordering::Relaxed);
						continue;
					}
					tracing::info!("took the actuator's lease");
					return Some(lease);
				}
				Err(error) => {
					if !waiting {
						tracing::info!(%error, "waiting for the actuator's lease");
						waiting = true;
					}
					if !sleep(root, self.cfg.timing.lease_retry).await {
						return None;
					}
				}
			}
		}
	}

	/// Renews the lease until the tenure ends, and ends it as soon as the lease is lost or may
	/// have expired.
	async fn keep_lease(self: Arc<Self>, tenure: CancellationToken) {
		let t = &self.cfg.timing;
		let mut renewed = Instant::now();
		while sleep(&tenure, t.lease_renew).await {
			match within(
				&tenure,
				self.act.renew_lease(&self.cfg.instance, t.lease_ttl),
			)
			.await
			{
				None => return,
				Some(Ok(())) => renewed = Instant::now(),
				Some(Err(error))
					if matches!(error, actuator::Error::Conflict(_))
						|| renewed.elapsed() >= t.lease_ttl - t.lease_renew =>
				{
					tracing::warn!(%error, "lost the actuator's lease");
					tenure.cancel();
					return;
				}
				Some(Err(error)) => tracing::warn!(%error, "renewing the actuator's lease"),
			}
		}
	}

	async fn act_as_holder(&self, tenure: &CancellationToken) {
		let Some(s) = self.read_actuator(tenure).await else {
			return;
		};
		if s.upgrading {
			// spec: SUPV#upgrades
			self.serve_as(Phase::Waking, &s);
			if !self.wait_upgrade(tenure).await {
				return;
			}
			// spec: SLPWK#rollouts
			self.wake(tenure).await;
		} else {
			self.take_over(tenure, &s).await;
		}
		while !tenure.is_cancelled() {
			self.next(tenure).await;
		}
	}

	/// Waits for the poll's next read; only the poll applies what the actuator reports.
	async fn read_actuator(&self, tenure: &CancellationToken) -> Option<Arc<actuator::State>> {
		within(tenure, self.polled.notified()).await?;
		self.latest.lock().unwrap().clone()
	}

	/// Applies what the actuator reports, read by a request that started at `asked`, dropping a
	/// read older than the last applied.
	///
	/// spec: SUPV#upgrades
	pub(crate) fn observe(&self, s: &actuator::State, asked: Instant) {
		let mut last = self.observed_asked.lock().unwrap();
		if last.is_some_and(|last| asked < last) {
			return;
		}
		*last = Some(asked);
		self.st.set_upgrading(s.upgrading);
		let was_upgrading = self.upgrading.swap(s.upgrading, Ordering::Relaxed);
		let controlled = self.controls.swap(s.controls_parts, Ordering::Relaxed);
		if was_upgrading != s.upgrading || controlled != s.controls_parts {
			tracing::info!(
				upgrading = s.upgrading,
				controls_parts = s.controls_parts,
				"actuator state changed"
			);
			self.changed.notify_one();
		}
	}

	/// Sets the phase from the state of the parts, and wakes a server that is not asleep.
	///
	/// spec: SUPV#resilience
	async fn take_over(&self, tenure: &CancellationToken, s: &actuator::State) {
		let parts = &self.cfg.parts;
		if !self.controls_parts() {
			self.set_awake();
		} else if s.all_desired(parts, Desired::Down) && s.all_observed(parts, Observed::Stopped) {
			tracing::info!("taking over an asleep server; keeping it asleep");
			self.serve_as(Phase::Asleep, s);
		} else if s.all_desired(parts, Desired::Up) && s.all_observed(parts, Observed::Ready) {
			self.serve_as(Phase::Awake, s);
		} else {
			tracing::info!("taking over a server neither awake nor asleep; waking it");
			self.serve_as(Phase::Waking, s);
			self.wake(tenure).await;
		}
	}

	fn serve_as(&self, phase: Phase, s: &actuator::State) {
		for p in &self.cfg.parts {
			self.st.set_ready(
				*p,
				s.parts
					.get(p)
					.is_some_and(|ps| ps.observed == Observed::Ready),
			);
		}
		self.announce(phase);
	}

	async fn next(&self, tenure: &CancellationToken) {
		let snap = self.st.snapshot();
		if snap.upgrading {
			// spec: SUPV#upgrades
			if self.wait_upgrade(tenure).await {
				tracing::info!("upgrade finished; waking the server");
				self.wake(tenure).await;
			}
		} else if !self.controls_parts() {
			// spec: SUPV#platforms
			self.set_awake();
			within(tenure, self.changed.notified()).await;
			if self.controls_parts() {
				if let Some(s) = self.read_actuator(tenure).await {
					Box::pin(self.take_over(tenure, &s)).await;
				}
			}
		} else if snap.phase == Phase::Asleep {
			tokio::select! {
				_ = tenure.cancelled() => {}
				_ = self.changed.notified() => {}
				_ = self.st.wake.notified() => {
					tracing::info!("activity while asleep; waking the server");
					self.wake(tenure).await;
				}
			}
		} else if snap.phase != Phase::Awake {
			self.wake(tenure).await;
		} else {
			self.await_idle(tenure, snap.last_activity, snap.in_flight)
				.await;
		}
	}

	/// Goes to sleep once the server is idle, or returns when something changes.
	///
	/// spec: SLPWK#activity
	async fn await_idle(
		&self,
		tenure: &CancellationToken,
		own_activity: Instant,
		own_in_flight: usize,
	) {
		let (others_activity, others_in_flight) = self.others();
		let last_activity = others_activity.map_or(own_activity, |o| o.max(own_activity));
		let timeout = if own_in_flight + others_in_flight == 0 {
			let mut due = last_activity + self.cfg.timing.idle_time;
			if let Some(next) = *self.next_attempt.lock().unwrap() {
				due = due.max(next);
			}
			if due <= Instant::now() {
				self.go_to_sleep(tenure).await;
				return;
			}
			Some(due)
		} else {
			None
		};
		let idle = async {
			match timeout {
				Some(due) => tokio::time::sleep_until(due.into()).await,
				None => std::future::pending().await,
			}
		};
		tokio::select! {
			_ = tenure.cancelled() => {}
			_ = idle => {}
			_ = self.st.activity.notified() => {}
			_ = self.changed.notified() => {}
			_ = self.polled.notified() => {}
			_ = self.st.wake.notified() => {}
		}
	}

	/// spec: SLPWK#going-to-sleep
	async fn go_to_sleep(&self, tenure: &CancellationToken) {
		self.announce(Phase::GoingToSleep);
		tracing::info!("going to sleep");

		let sleeping = tenure.child_token();
		let cause = Mutex::new(None);
		let watch = async {
			tokio::select! {
				_ = sleeping.cancelled() => return,
				_ = self.st.wake.notified() => *cause.lock().unwrap() = Some(StepError::Activity),
				_ = async {
					loop {
						self.changed.notified().await;
						if self.upgrading.load(Ordering::Relaxed) {
							*cause.lock().unwrap() = Some(StepError::Upgrade);
							return;
						}
						if !self.controls_parts() {
							*cause.lock().unwrap() = Some(StepError::NotControlled);
							return;
						}
					}
				} => {}
			}
			sleeping.cancel();
		};
		let steps = async {
			let mut result = Ok(());
			for (name, step) in self.sleep_steps() {
				let outcome = match step {
					Step::Settle => within(&sleeping, self.settle()).await,
					Step::CheckRelease => within(&sleeping, self.check_release()).await,
					Step::Hold => within(&sleeping, self.hold()).await,
					Step::Stop(parts) => within(&sleeping, self.stop(parts)).await,
					Step::FinalSync => within(&sleeping, self.final_sync()).await,
				};
				match outcome {
					Some(Ok(())) => {}
					Some(Err(e)) => {
						result = Err((name, e));
						break;
					}
					None => {
						result = Err((name, StepError::Cancelled));
						break;
					}
				}
			}
			sleeping.cancel();
			result
		};
		let ((), result) = tokio::join!(watch, steps);

		if tenure.is_cancelled() {
			return;
		}
		let cause = cause.lock().unwrap().take();
		match (cause, result) {
			(Some(StepError::Activity), Err((step, _))) => {
				tracing::info!(step, "activity cancelled the sleep; waking the server");
				Box::pin(self.wake(tenure)).await;
			}
			(Some(cause), Err((step, _))) | (None, Err((step, cause @ StepError::Upgrade))) => {
				tracing::info!(?cause, step, "sleep cancelled");
			}
			(None, Err((_, StepError::Busy(why)))) => {
				tracing::info!(why, "not sleeping");
				*self.next_attempt.lock().unwrap() =
					Some(Instant::now() + self.cfg.timing.busy_recheck);
				self.announce(Phase::Awake);
			}
			(_, Err((step, error))) => {
				self.fail(format!("going to sleep, at {step}: {error:?}"));
				*self.next_attempt.lock().unwrap() =
					Some(Instant::now() + self.cfg.timing.idle_time);
				Box::pin(self.wake(tenure)).await;
			}
			(_, Ok(())) => {
				self.st.set_failure(None);
				self.wake_failed.store(false, Ordering::Relaxed);
				self.announce(Phase::Asleep);
				tracing::info!("asleep");
			}
		}
	}

	fn sleep_steps(&self) -> Vec<(&'static str, Step)> {
		let mut steps = vec![
			("settled", Step::Settle),
			("checked", Step::CheckRelease),
			("held", Step::Hold),
			("tasks-stopped", Step::Stop(vec![Part::Tasks, Part::Fhir])),
		];
		if !self.cfg.central {
			steps.push(("synced", Step::FinalSync));
		}
		steps.push(("parts-stopped", Step::Stop(vec![Part::Sync, Part::Api])));
		steps.push(("database-stopped", Step::Stop(vec![Part::Database])));
		steps
	}

	fn not_upgrading(&self) -> Result<(), StepError> {
		if self.upgrading.load(Ordering::Relaxed) {
			Err(StepError::Upgrade)
		} else {
			Ok(())
		}
	}

	/// spec: SLPWK#going-to-sleep
	async fn check_release(&self) -> Result<(), StepError> {
		self.not_upgrading()?;
		if self.cfg.release == buildinfo::DEV {
			if !self.dev_logged.swap(true, Ordering::Relaxed) {
				tracing::warn!(
					"a development build does not know its release; not checking the server's"
				);
			}
			return Ok(());
		}
		let version = self.api.version().await?;
		if !buildinfo::same_line(&version, self.cfg.release) {
			return Err(StepError::Failed(format!(
				"the server runs release {version}, and the supervisor {}, of another line",
				self.cfg.release
			)));
		}
		Ok(())
	}

	async fn hold(&self) -> Result<(), StepError> {
		self.not_upgrading()?;
		let hold = self.api.hold_tasks().await?;
		if hold.busy {
			return Err(StepError::Busy(format!(
				"running tasks {:?}, FHIR jobs {}",
				hold.running_tasks, hold.fhir_jobs
			)));
		}
		Ok(())
	}

	/// spec: SLPWK#going-to-sleep
	async fn final_sync(&self) -> Result<(), StepError> {
		self.not_upgrading()?;
		let sync = self.api.final_sync().await?;
		if !sync.completed {
			return Err(StepError::Failed(format!(
				"the final sync did not complete: {}",
				sync.reason
			)));
		}
		Ok(())
	}

	/// Stops those of the parts the server has, and waits until they have. Cancelling the sleep
	/// cancels the wait but not the request, which could otherwise land after the wake's.
	async fn stop(&self, parts: Vec<Part>) -> Result<(), StepError> {
		let parts: Vec<Part> = parts
			.into_iter()
			.filter(|p| self.cfg.parts.contains(p))
			.collect();
		let mut desired = BTreeMap::new();
		for p in &parts {
			self.st.set_ready(*p, false);
			desired.insert(*p, Desired::Down);
		}
		// TODO: let the request finish when the sleep is cancelled, rather than dropping it.
		self.set(&desired).await?;
		self.act
			.await_parts(
				&parts,
				Observed::Stopped,
				self.cfg.timing.part_timeout,
				|_| {},
			)
			.await?;
		Ok(())
	}

	async fn set(&self, desired: &BTreeMap<Part, Desired>) -> Result<(), actuator::Error> {
		let asked = Instant::now();
		let s = self.act.set(desired).await?;
		self.observe(&s, asked);
		Ok(())
	}

	/// spec: SLPWK#waking
	async fn wake(&self, tenure: &CancellationToken) {
		self.announce(Phase::Waking);
		let mut backoff = self.cfg.timing.wake_backoff;
		loop {
			// spec: SUPV#upgrades
			if !self.wait_upgrade(tenure).await {
				return;
			}
			if !self.controls_parts() {
				self.set_awake();
				return;
			}
			match within(tenure, self.wake_once()).await {
				None => return,
				Some(Ok(())) => break,
				Some(Err(StepError::Upgrade)) => continue,
				Some(Err(error)) => {
					self.fail(format!("waking: {error:?}"));
					self.wake_failed.store(true, Ordering::Relaxed);
					if !sleep(tenure, backoff).await {
						return;
					}
					backoff = (backoff * 2).min(self.cfg.timing.wake_backoff_max);
				}
			}
		}
		// The hold expires by itself, so failing to release it does not stop the wake.
		if self.not_upgrading().is_ok() {
			if let Err(error) = self.api.release_tasks().await {
				tracing::warn!(%error, "releasing the task hold");
			}
		}
		if self.wake_failed.swap(false, Ordering::Relaxed) {
			self.st.set_failure(None);
		}
		self.set_awake();
		tracing::info!("awake");
	}

	async fn wake_once(&self) -> Result<(), StepError> {
		let mark_ready = |s: &actuator::State| {
			for p in &self.cfg.parts {
				if s.parts
					.get(p)
					.is_some_and(|ps| ps.observed == Observed::Ready)
				{
					self.st.set_ready(*p, true);
				}
			}
		};
		self.set(&BTreeMap::from([(Part::Database, Desired::Up)]))
			.await?;
		self.act
			.await_parts(
				&[Part::Database],
				Observed::Ready,
				self.cfg.timing.part_timeout,
				mark_ready,
			)
			.await?;
		// spec: SUPV#upgrades
		self.not_upgrading()?;
		let rest: Vec<Part> = self
			.cfg
			.parts
			.iter()
			.copied()
			.filter(|p| *p != Part::Database)
			.collect();
		self.set(&rest.iter().map(|p| (*p, Desired::Up)).collect())
			.await?;
		self.act
			.await_parts(
				&rest,
				Observed::Ready,
				self.cfg.timing.part_timeout,
				mark_ready,
			)
			.await?;
		Ok(())
	}

	async fn wait_upgrade(&self, tenure: &CancellationToken) -> bool {
		while self.upgrading.load(Ordering::Relaxed) {
			if within(tenure, self.changed.notified()).await.is_none() {
				return false;
			}
		}
		!tenure.is_cancelled()
	}

	pub(crate) fn set_awake(&self) {
		self.st.set_all_ready(true);
		self.announce(Phase::Awake);
	}

	fn fail(&self, message: String) {
		tracing::warn!(message);
		self.st.set_failure(Some(message));
	}
}

enum Step {
	Settle,
	CheckRelease,
	Hold,
	Stop(Vec<Part>),
	FinalSync,
}
