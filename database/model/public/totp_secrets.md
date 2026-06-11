{% docs table__totp_secrets %}
Users' TOTP (authenticator app) seeds for multi-factor authentication. The seed
is a symmetric secret that cannot be hashed (verification needs the literal
value), so this table exists only on the central server and never syncs;
facility servers forward entered codes to central for verification. One seed
per user; re-enrolling replaces it.
{% enddocs %}

{% docs totp_secrets__user_id %}
The user this seed belongs to. Unique: a user has at most one TOTP seed.
{% enddocs %}

{% docs totp_secrets__secret %}
The TOTP seed, stored as an encrypted envelope (`S1:{iv}:{ciphertext}`, keyed
by the settings pre-shared key) — never plaintext.
{% enddocs %}

{% docs totp_secrets__confirmed_at %}
When the user confirmed the enrolment by entering a valid code. A seed is
pending until confirmed, and only confirmed seeds count as a factor at login.
{% enddocs %}
