# Central server API docs

## Application routes

### Login

```
POST /api/login
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
GET /api/whoami
```

This is a utility route to verify a token. If the token is valid, this will respond with information about the currently logged-in user.

### Attachment

```
GET /api/attachment
```

## Sync routes

```
POST /api/sync/channels
```

```
GET /api/sync/:channelId
POST /api/sync/:channelId
```

```
DELETE /api/sync/:channelId/:recordId
```
