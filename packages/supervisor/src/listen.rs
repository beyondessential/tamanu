//! Listening sockets, and the connections they accept.

use std::{
	io,
	net::{Ipv4Addr, Ipv6Addr, SocketAddr},
	pin::Pin,
	task::{Context, Poll, ready},
	time::Duration,
};

use socket2::{Domain, Socket, Type};
use tokio::{
	io::{AsyncRead, AsyncWrite, ReadBuf},
	net::{TcpListener, TcpStream},
	time::{Instant, Sleep, sleep},
};

use crate::config::Bind;

const BACKLOG: i32 = 1024;

/// Binds a listener. A port on every address takes IPv6 and IPv4 on one socket, or IPv4 alone
/// where IPv6 is switched off. A port already taken, or one the process may not bind, is an error
/// on either.
pub fn bind(bind: Bind) -> io::Result<TcpListener> {
	match bind {
		Bind::Addr(addr) => listen(addr, false),
		Bind::Any(port) => match listen((Ipv6Addr::UNSPECIFIED, port).into(), true) {
			Err(error)
				if !matches!(
					error.kind(),
					io::ErrorKind::AddrInUse | io::ErrorKind::PermissionDenied
				) =>
			{
				tracing::warn!(%error, port, "IPv6 unavailable; listening on IPv4 alone");
				listen((Ipv4Addr::UNSPECIFIED, port).into(), false)
			}
			bound => bound,
		},
	}
}

fn listen(addr: SocketAddr, dual_stack: bool) -> io::Result<TcpListener> {
	let socket = Socket::new(Domain::for_address(addr), Type::STREAM, None)?;
	if dual_stack {
		socket.set_only_v6(false)?;
	}
	// Lets a restarted process take the port while the old one's connections close.
	#[cfg(unix)]
	socket.set_reuse_address(true)?;
	socket.bind(&addr.into())?;
	socket.listen(BACKLOG)?;
	socket.set_nonblocking(true)?;
	TcpListener::from_std(socket.into())
}

/// A connection that is closed once a read or write it is waiting on makes no progress for the
/// stall timeout, so a client that stops reading a response or sending a body cannot hold it
/// open. The timer restarts on every read and write that makes progress, so a large transfer at
/// any steady pace is unaffected.
///
/// spec: SUPV#connections
pub struct Stalling {
	stream: TcpStream,
	timeout: Duration,
	read: Timer,
	write: Timer,
}

/// How long one direction of a connection has been waiting. The sleep is made once, on the first
/// wait, and reset for each later one.
#[derive(Default)]
struct Timer {
	sleep: Option<Pin<Box<Sleep>>>,
	armed: bool,
}

impl Stalling {
	pub fn new(stream: TcpStream, timeout: Duration) -> Self {
		Self {
			stream,
			timeout,
			read: Timer::default(),
			write: Timer::default(),
		}
	}
}

/// Polls `io`, tracking how long it has been pending in `timer`.
fn watch<T>(
	timer: &mut Timer,
	timeout: Duration,
	cx: &mut Context<'_>,
	io: Poll<io::Result<T>>,
) -> Poll<io::Result<T>> {
	if io.is_ready() {
		timer.armed = false;
		return io;
	}
	if !timer.armed {
		match &mut timer.sleep {
			Some(deadline) => deadline.as_mut().reset(Instant::now() + timeout),
			None => timer.sleep = Some(Box::pin(sleep(timeout))),
		}
		timer.armed = true;
	}
	let deadline = timer.sleep.as_mut().expect("armed above");
	ready!(deadline.as_mut().poll(cx));
	Poll::Ready(Err(io::Error::new(
		io::ErrorKind::TimedOut,
		"connection stalled",
	)))
}

impl AsyncRead for Stalling {
	fn poll_read(
		mut self: Pin<&mut Self>,
		cx: &mut Context<'_>,
		buf: &mut ReadBuf<'_>,
	) -> Poll<io::Result<()>> {
		let this = &mut *self;
		let io = Pin::new(&mut this.stream).poll_read(cx, buf);
		watch(&mut this.read, this.timeout, cx, io)
	}
}

impl AsyncWrite for Stalling {
	fn poll_write(
		mut self: Pin<&mut Self>,
		cx: &mut Context<'_>,
		buf: &[u8],
	) -> Poll<io::Result<usize>> {
		let this = &mut *self;
		let io = Pin::new(&mut this.stream).poll_write(cx, buf);
		watch(&mut this.write, this.timeout, cx, io)
	}

	fn poll_write_vectored(
		mut self: Pin<&mut Self>,
		cx: &mut Context<'_>,
		bufs: &[io::IoSlice<'_>],
	) -> Poll<io::Result<usize>> {
		let this = &mut *self;
		let io = Pin::new(&mut this.stream).poll_write_vectored(cx, bufs);
		watch(&mut this.write, this.timeout, cx, io)
	}

	fn is_write_vectored(&self) -> bool {
		self.stream.is_write_vectored()
	}

	fn poll_flush(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<io::Result<()>> {
		let this = &mut *self;
		let io = Pin::new(&mut this.stream).poll_flush(cx);
		watch(&mut this.write, this.timeout, cx, io)
	}

	fn poll_shutdown(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<io::Result<()>> {
		Pin::new(&mut self.stream).poll_shutdown(cx)
	}
}

#[cfg(test)]
mod tests {
	use tokio::io::{AsyncReadExt, AsyncWriteExt};

	use super::*;

	async fn pair(timeout: Duration) -> (Stalling, TcpStream) {
		let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
		let client = TcpStream::connect(listener.local_addr().unwrap())
			.await
			.unwrap();
		let (server, _) = listener.accept().await.unwrap();
		(Stalling::new(server, timeout), client)
	}

	#[tokio::test]
	async fn a_stalled_read_times_out() {
		let (mut server, _client) = pair(Duration::from_millis(50)).await;
		let error = server.read(&mut [0; 8]).await.unwrap_err();
		assert_eq!(error.kind(), io::ErrorKind::TimedOut);
	}

	#[tokio::test]
	async fn a_read_that_progresses_does_not() {
		let (mut server, mut client) = pair(Duration::from_millis(200)).await;
		let writer = tokio::spawn(async move {
			for _ in 0..5 {
				tokio::time::sleep(Duration::from_millis(100)).await;
				client.write_all(b"x").await.unwrap();
			}
		});
		let mut got = 0;
		while got < 5 {
			got += server.read(&mut [0; 8]).await.unwrap();
		}
		writer.await.unwrap();
	}

	#[tokio::test]
	async fn a_taken_port_is_an_error_rather_than_ipv4_alone() {
		let taken = bind(Bind::Any(0)).unwrap();
		let port = taken.local_addr().unwrap().port();
		let error = bind(Bind::Any(port)).unwrap_err();
		assert_eq!(error.kind(), io::ErrorKind::AddrInUse);
	}

	#[tokio::test]
	async fn any_port_takes_ipv4() {
		let listener = bind(Bind::Any(0)).unwrap();
		let port = listener.local_addr().unwrap().port();
		TcpStream::connect((Ipv4Addr::LOCALHOST, port))
			.await
			.unwrap();
	}
}
