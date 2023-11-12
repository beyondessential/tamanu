# Central server API docs

## Application routes

### Login

```
POST /v1/login
```

Expects a JSON-formatted body containing `email` and `password` fields. 

Will respond with a payload containing an authentication token to be attached to future requests, as well as up-to-date information about the freshly logged-in user's settings.

```json
{
  "token": "abcd",
  "localisation": {
    ...
  },
  "user": {
    "id": "abcd",
    "displayName": "Joe Docs",
    "email": "joe@tamanu.io",
    "role": "admin"
  }
}
```

```
GET /v1/whoami
```

This is a utility route to verify a token. If the token is valid, this will respond with information about the currently logged-in user.

### Attachment

```
GET /v1/attachment
```

## Sync routes

```
POST /v1/sync/channels
```

```
GET /v1/sync/:channelId
POST /v1/sync/:channelId
```

```
DELETE /v1/sync/:channelId/:recordId
```
