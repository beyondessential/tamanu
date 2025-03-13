## one_time_logins

One time logins are used for password resets.

## user_id

The `user` for whom this one time login is for.

## token

A random value to use as the login code.

This is sent to the user in an email and then entered in a form to reset their password.

## expires_at

Beyond this time, the one time login can no longer be used.

## used_at

When this token was used.

