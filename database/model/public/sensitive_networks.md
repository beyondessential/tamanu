{% docs table__sensitive_networks %}
Table of sensitive networks.

A sensitive network is a named group of [facilities](#!/source/source.tamanu.tamanu.facilities) that
share confidential data. Encounter-linked data recorded at a facility in a network reaches every
facility in that network and nowhere else, while data recorded at a facility outside any network
syncs normally.

A facility belongs to at most one network, and is sensitive exactly when it belongs to one. A
facility holding confidential data on its own is a network of one.
{% enddocs %}

{% docs sensitive_networks__code %}
Code (identifier) for the network.
{% enddocs %}

{% docs sensitive_networks__name %}
Full readable name.
{% enddocs %}
