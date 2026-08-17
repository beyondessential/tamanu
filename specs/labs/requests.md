---
id: LABRQ
---

# Lab requests

How a lab request submission is grouped into requests, how the tests on a request are
attributed to the panels that were ordered, and how that composition carries through to
billing and the external laboratory integration.

## Composing a request

- [ ] A submission produces one lab request per lab test category, holding both the panels and the individual tests ordered from that category.
- [ ] A panel joins the request for the panel's own category.
- [ ] Each panel ordered in a submission is recorded as a panel request against the lab request it joins, so one request can hold several panel requests.

## Attributing tests to panels

- [ ] Each lab test on a request is attributed to at most one of that request's panel requests.
- [ ] A lab test with no panel attribution is an individual test.
- [ ] Tests added to a request by the external laboratory, such as reflex tests, carry no panel attribution and so are individual tests.
- [ ] A request holding exactly one panel request, none of whose tests carry a panel attribution, treats all of its tests as belonging to that panel.

## Test types shared between panels

- [ ] A test type belonging to two panels on the same request has one lab test per panel.
- [ ] A result recorded against a test type applies to every lab test of that type on the request, whether the result arrives from the external laboratory or is entered manually.

## Billing

See `invoicing/overview.md` for how invoice products and price lists work.

- [ ] A panel that has an invoice product bills that product once for its panel request, and the tests belonging to that panel are not billed individually.
- [ ] A panel that has no invoice product does not bill for the panel, and its tests bill individually against their test type products.
- [ ] A test type appearing more than once on a request bills once, however many panels contributed it.

## External laboratory integration

- [ ] A lab request maps to a single service request and a single specimen, so a request holding several panels maps to one sample at the laboratory.
- [ ] The service request's order detail carries both the panels and the individual tests on the request, each identified by its own code system: the lab panel code system for panels and the lab test code system for tests.
