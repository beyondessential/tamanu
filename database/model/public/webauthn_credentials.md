{% docs table__webauthn_credentials %}
WebAuthn (passkey) credentials enrolled by users as a multi-factor
authentication factor. Only the public half of the credential is stored (the
private key never leaves the user's authenticator), so rows are safe to
replicate and sync everywhere, letting a credential enrolled at one server be
verified offline at any other server under the same relying party ID. The
WebAuthn signature counter is deliberately not stored: it is never enforced.
{% enddocs %}

{% docs webauthn_credentials__user_id %}
The user this credential belongs to.
{% enddocs %}

{% docs webauthn_credentials__credential_id %}
The credential ID minted by the authenticator at registration,
base64url-encoded. Globally unique.
{% enddocs %}

{% docs webauthn_credentials__public_key %}
The credential's COSE public key, base64url-encoded. Used to verify assertion
signatures at login. Public data.
{% enddocs %}

{% docs webauthn_credentials__rp_id %}
The WebAuthn relying party ID the credential is bound to (the common stem of
the deployment's domain names). Browsers only permit assertions at origins this
is a registrable suffix of.
{% enddocs %}

{% docs webauthn_credentials__transports %}
The authenticator transports reported at registration (e.g. `internal`,
`hybrid`, `usb`), as a JSON array. Echoed in assertion options so browsers know
how to reach the authenticator.
{% enddocs %}

{% docs webauthn_credentials__aaguid %}
The authenticator's AAGUID (make/model identifier) as reported at registration,
where available.
{% enddocs %}

{% docs webauthn_credentials__enrolment_origin %}
The web origin the registration ceremony ran at, kept for audit.
{% enddocs %}

{% docs webauthn_credentials__friendly_name %}
A user-supplied label for the credential (e.g. which device it lives on), shown
in security-method lists.
{% enddocs %}

{% docs webauthn_credentials__last_used_at %}
When the credential last successfully completed an assertion (login).
{% enddocs %}
