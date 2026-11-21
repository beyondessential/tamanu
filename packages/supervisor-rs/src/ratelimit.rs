//! Rate limits per client address: one timestamp per address, swept while it is quiet.

use std::{net::IpAddr, num::NonZeroU32, sync::Arc, time::Duration};

use governor::{DefaultKeyedRateLimiter, Quota, RateLimiter};

pub struct Limits {
	api: DefaultKeyedRateLimiter<IpAddr>,
	login: DefaultKeyedRateLimiter<IpAddr>,
}

impl Limits {
	pub fn new() -> Arc<Self> {
		let n = |v| NonZeroU32::new(v).unwrap();
		let limits = Arc::new(Self {
			// 1000 a second, in bursts of up to 100.
			api: RateLimiter::keyed(Quota::per_second(n(1000)).allow_burst(n(100))),
			login: RateLimiter::keyed(Quota::per_second(n(10))),
		});
		let sweeping = Arc::downgrade(&limits);
		tokio::spawn(async move {
			let mut tick = tokio::time::interval(Duration::from_secs(10));
			loop {
				tick.tick().await;
				let Some(limits) = sweeping.upgrade() else {
					return;
				};
				for limiter in [&limits.api, &limits.login] {
					limiter.retain_recent();
					limiter.shrink_to_fit();
				}
			}
		});
		limits
	}

	/// Whether the client may make a request to the api at this path.
	pub fn allow(&self, client: IpAddr, path: &str) -> bool {
		if path == "/api/login" && self.login.check_key(&client).is_err() {
			return false;
		}
		self.api.check_key(&client).is_ok()
	}
}
