{% docs table__mfa_challenges %}
Ephemeral single-use multi-factor authentication tokens: WebAuthn ceremony
challenges (registration and assertion nonces), and admin-issued enrolment
invite tokens. Issued and verified by whichever server runs the ceremony, never
synced. Rows are short-lived and become dead weight once used or expired.
{% enddocs %}

{% docs mfa_challenges__user_id %}
The user the token is bound to. Null for usernameless WebAuthn assertion
challenges, which are issued before the user is known.
{% enddocs %}

{% docs mfa_challenges__type %}
What the token is for: a WebAuthn registration challenge, a WebAuthn assertion
challenge, or an MFA enrolment invite.
{% enddocs %}

{% docs mfa_challenges__token %}
The token value: a WebAuthn challenge nonce, or an enrolment invite token.
Single-use.
{% enddocs %}

{% docs mfa_challenges__expires_at %}
When the token stops being redeemable.
{% enddocs %}

{% docs mfa_challenges__used_at %}
When the token was redeemed. A non-null value means it cannot be used again.
{% enddocs %}
