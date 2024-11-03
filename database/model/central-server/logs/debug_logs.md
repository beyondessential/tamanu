{% docs logs__table__debug_logs %}
Debugging logs stored in the database for easy reporting.

Tamanu has an associated tool called [Tamanu Alerts] which runs queries on the Tamanu database to
determine alert conditions, especially for the Sync mechanisms. However, sometimes the information
necessary to determine an alert condition lives in logs, not in database tables. In those cases,
this table is used.

[Tamanu Alerts]: https://docs.rs/bestool/latest/bestool/__help/tamanu/alerts/struct.AlertsArgs.html
{% enddocs %}

{% docs logs__debug_logs__id %}
UUID
{% enddocs %}

{% docs logs__debug_logs__type %}
Stable classifier for the log message.
{% enddocs %}

{% docs logs__debug_logs__info %}
Arbitrary JSON log message.

Not that unlike typical JSON-based log messages (only top-level string key to scalar value), this
can be nested arbitrarily deep, as it can include objects directly from the application.
{% enddocs %}
