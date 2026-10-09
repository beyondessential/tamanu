---
id: CEND
---

# Central connection endpoints

A facility server can reach central over more than one network path, such as the public internet, an intranet, or a tailnet. Administrators define an ordered list of central endpoints in settings, facility servers try them in order, and a facility only uses an endpoint after logging in at it successfully. The list also lets a deployment move central to a new name without stranding facilities on the old one.

## The endpoint setting

- [ ] The list is the setting `sync.centralEndpoints`, an ordered list of endpoint URLs. It is declared at the global and facility scopes, so an administrator can set a list that applies to every facility and a list for a single facility.
- [ ] The setting is high risk, so only an administrator with full (manage-all) permission can change it. See `administration/settings/overview.md`.
- [ ] An endpoint is a URL made of a scheme, a host and an optional port. It carries no path, query, fragment or credentials. The scheme is `https` or `http`.
- [ ] Endpoints are compared after normalisation: the host is lowercased and a trailing slash is ignored, so two spellings of the same endpoint count as one.
- [ ] A facility's effective list is its facility-scope entries in order, followed by the global entries in order, with any endpoint already present dropped from its later position. Facility entries therefore take priority, and a global endpoint reaches every facility without being repeated for each.
- [ ] A facility server that hosts several facilities uses the entries of each hosted facility in turn, then the global entries, with duplicates dropped in the same way.
- [ ] An empty or unset list at every scope means central supplies no endpoints.

### Plain HTTP

- [ ] An `https` endpoint is accepted for any host.
- [ ] An `http` endpoint is accepted only when it does not lie on the internet. That means the host is a name with no dot, such as `central`, or ends in `.local`, `.internal`, `.lan`, `.home.arpa`, `.intranet`, `.corp`, `.private` or `.ts.net`, or is a bare IP address in a private, loopback, link-local or Tailscale range. IPv4 and IPv6 ranges are both covered.
- [ ] An `http` endpoint with any other host is rejected when the setting is saved.
- [ ] An `http` endpoint is rejected when the setting is saved while `security.requireHttps` is in effect on central, because central would refuse the connection. See `administration/settings/require-https.md`.
- [ ] An `http` endpoint already stored when `security.requireHttps` is later enabled on central fails verification when a facility tries it, and the facility moves on to the next endpoint.

## Recorded endpoints on the facility

A facility server holds an ordered list of central hosts, recorded in the order it tries them. It is the only source the facility uses to find central.

- [ ] Setup records a single host, so a newly set up facility server's list has one entry. The host comes from the setup wizard or the setup command.
- [ ] When `SYNC_URL` is set in the environment, the host list is that one host and central-supplied lists are ignored, because an external system decides where the facility connects.
- [ ] During sync, central supplies the facility's effective list. When the list is empty, the recorded list stands as it is.
- [ ] A supplied list that matches the recorded list changes nothing.
- [ ] A supplied list that differs is verified before it is recorded. The facility logs in at its entries in order and stops at the first one that succeeds. When one succeeds, the whole supplied list replaces the recorded list, and entries dropped from central's list are dropped from the facility's.
- [ ] When no entry of a supplied list passes the login, the recorded list stands, the failure is logged, and the facility tries the supplied list again on a later sync.
- [ ] The boot-time check that compares a host declared in the environment or configuration with the recorded host does not run once central has supplied a list.
- [ ] A change to the recorded list applies to the sync connection, the websocket connection and time synchronisation without a restart.
- [ ] A facility server that is offline while the list changes keeps its recorded list and picks up the change on its next successful sync.

## Choosing an endpoint

- [ ] A facility server uses an endpoint only after logging in at it with its sync credentials, and sends no sync traffic to an endpoint before that login succeeds.
- [ ] Central is trusted as the source of the list, so a successful login establishes that the endpoint is reachable and accepts the facility's credentials, and nothing further about the endpoint is checked.
- [ ] The facility tries its recorded hosts in order and uses the first one that passes the login.
- [ ] When the endpoint in use stops working, whether the connection fails or the login is refused, the facility walks the list again from the top.
- [ ] When every endpoint fails, the facility retries under the same backoff it applies to a single unreachable central.
- [ ] While the facility is on an endpoint other than the first, it periodically checks earlier endpoints with the same login. When an earlier one passes, the facility moves to the highest-priority endpoint that passes. The recheck interval is set by a setting.
- [ ] A sync session that is already in progress finishes on its endpoint, or fails, before the facility moves to another.
- [ ] Sync, the websocket connection and time synchronisation each apply these rules independently, so they can sit on different endpoints for a short time, and they converge on the same endpoint.
- [ ] Each attempt and its result is logged with the endpoint, the outcome and the reason for a failure. Credentials are never logged.

## Reporting the endpoint in use

Central cannot reliably tell which name a facility used, because a reverse proxy can rewrite or hide it, so the facility reports it.

- [ ] When a facility server starts a sync session it reports the endpoint it is using.
- [ ] Central records, for each facility server, the last endpoint reported and when it was reported.
- [ ] The admin panel shows that endpoint and time on each facility's page. A facility that has never reported shows neither.

## Rotating central to a new name

- [ ] To move central to a new name, an administrator adds the new name to the list, and every facility that syncs verifies it and records it.
- [ ] The administrator confirms from the reported endpoints that facilities are using the new name before removing the old name from the list.
- [ ] A facility that has recorded the new name carries on when the old name stops resolving, because the new name is already in its recorded list.
