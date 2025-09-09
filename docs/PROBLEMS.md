<!-- Keep in sync with the @tamanu/errors package, especially the types.ts file -->

# Problems (Tamanu Error Types)

Tamanu APIs emit errors in a format compatible with [RFC 9457: Problem Details for HTTP APIs][RFC9457].
When possible, standard problem types are emitted; these are documented at the IANA registry for [HTTP Problem Types][IANA].
All other problem types are documented below.

[RFC9457]: https://datatracker.ietf.org/doc/html/rfc9457
[IANA]: https://iana.org/assignments/http-problem-types

## Unknown

The generic error type used when no other error type is known.
This is used for:
- legacy server and application errors which have not yet been migrated to this classification;
- bugs that result in unexpected behavior, uncaught by the normal error handling.

## Not found

A generic error type used when a resource is not found.

## Conflict

An edit is conflicting with the current state on the server.

This is commonly due to a race condition or when separate users are editing the same resource at the same time.
For example, if two users are setting appointment times, and happen to attempt to book the same slot.

## Insufficient storage

Issued by endpoints that upload files, when there's not enough space or quota to receive and/or store the data.

## Rate limited

You've exceeded the rate limit for this endpoint.

The `detail` field may contain more detail on which rate limit was exceeded.
The `retry-after` field will contain the number of seconds until the rate limit resets; this is also available as the `Retry-After` HTTP header.

## Remote unreachable

A number of endpoints in Tamanu actually query remote services.
In most cases, errors will be re-emitted, but if the connection cannot be established, this error happens instead.
The `detail` field will contain a string describing the error, such as "timeout" or "connection refused".

## Remote incompatible

When a remote service is reachable, but is incompatible with the querying service.
For example, this may happen during an upgrade, where different components are transitionally in a version skew.

## Client incompatible

When a client is incompatible with the server it's trying to reach.
This typically only occurs between Tamanu components (such as the Facility API server and the web client), as those have strict version skew requirements.

## Auth

Authentication errors are either emitted as the generic `auth` type, or more often as a specific subtype.
Authentication in Tamanu is performed using **credentials** (such as email/password, headers, device ID, API key, OTP) which are used to obtain session-specific **tokens** (JWTs).
Error types differentiate between these two concepts.

### Auth: credential invalid

This is used when a user's credentials are invalid.

This error does not differentiate between the password being invalid or the user not existing, to avoid leaking information about the existence of a user.

### Auth: credential missing

This is used when a user's credentials are missing (i.e. not provided in the authentication request, or not at the right key).

### Auth: token invalid

This is used when a login or refresh token is invalid.

The `detail` field may differentiate how the token is invalid.

### Auth: permissions

This is used when a user does not have the required permissions to perform an action.

### Auth: permission required

This is used when a user does not have the required permissions to authenticate.

Most permission checks apply post-authentication, for discrete actions and data visibility.
However, there are a few permissions that restrict users access to whole (facility) servers.
The `detail` field may differentiate which permission or configuration is restricting access.

## Validation

A generic validation error.

### Validation: operation

The operation specified is invalid or unknown.

### Validation: parameter

The parameter specified is invalid or unknown.
The `detail` field may differentiate which parameter is invalid, and how.

### Validation: database

A validation applied by the database layer.

These are typically caused not by invalid input, but by database constraints and integrity violations.
The `detail` field may describe what exactly is wrong.

### Validation: duplicate

A resource creation or update attempt failed because a conflicting or duplicate resource already exists.
The `detail` field may describe what exactly is wrong.

### Validation: constraint

A resource creation or update attempt failed because a constraint was violated.
The `detail` field may describe what exactly is wrong.

### Validation: relation

A resource creation or update attempt failed because a relation was violated.
The `detail` field may describe what exactly is wrong.
