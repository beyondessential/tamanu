---
id: LABRQ
---

# Composing lab requests

How a lab request submission is grouped into requests, how the tests on a request are
attributed to the panels that were ordered, and how that composition carries through to
billing and the external laboratory integration. The staff-facing screen for raising a
request is specified in `requests.md`.

## Composing a request

- [ ] Importing a lab test panel that has no lab test category is rejected as an import error, so newly authored panels always carry a category.
- [ ] Importing a lab test panel whose test types do not all belong to one lab test category is rejected as an import error.
- [ ] A submission produces one lab request per lab test category, holding both the panels and the individual tests ordered from that category.
- [ ] A panel joins the request for the panel's own category.
- [ ] A panel that has no category of its own joins the request for the category its test types share.
- [ ] A panel that has no category of its own and whose test types do not share a single category forms its own lab request.
- [ ] A submission is rejected if any panel it orders has no test types available at the requesting facility.
- [ ] Each panel ordered in a submission is recorded as a panel request against the lab request it joins, so one request can hold several panel requests.

## Attributing tests to panels

- [ ] Each lab test on a request is attributed to at most one of that request's panel requests.
- [ ] A lab test with no panel attribution is an individual test.
- [ ] Tests added to a request by the external laboratory, such as reflex tests, carry no panel attribution and so are individual tests.
- [ ] A request holding exactly one panel request, none of whose tests carry a panel attribution, treats all of its tests as belonging to that panel.

## Test types shared between panels

- [ ] A test type belonging to two panels on the same request has one lab test per panel.

## Billing

See `invoicing/overview.md` for how invoice products and price lists work.

- [ ] A panel that has an invoice product bills that product once for its panel request, and the tests belonging to that panel are not billed individually.
- [ ] A panel that has no invoice product does not bill for the panel, and its tests bill individually against their test type products.
- [ ] A test type appearing more than once on a request bills once, however many panels contributed it.
- [ ] An individually ordered test bills against its test type product even when a panel on the same request covers the same test type through a panel product; the two are charged separately.

## External laboratory integration

- [ ] A lab request maps to a single service request and a single specimen, so a request holding several panels maps to one sample at the laboratory.
- [ ] The service request's code identifies the lab test category the request is grouped under, drawn from a configurable lab test category code system.
- [ ] The service request's order detail carries both the panels and the individual tests on the request, each drawn from its own configurable code system so the two can be told apart: the lab panel code system for panels, the lab test code system for tests.
