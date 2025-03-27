{% docs table__permissions %}
These are associations of permissions to roles.

Permissions are modeled on the concept of a sentence like

```
ROLE can VERB the NOUN
ROLE can VERB the NOUN which is specifically the OBJECT ID
```

See also the [`roles`](#!/source/source.tamanu.tamanu.roles) and
[`users`](#!/source/source.tamanu.tamanu.users) tables.
{% enddocs %}

{% docs permissions__role_id %}
The [`role`](#!/source/source.tamanu.tamanu.roles) authorised for this permission.
{% enddocs %}

{% docs permissions__noun %}
The subject of the action/permission, usually the model or resource being affected.

Nouns are defined in `PascalCase` and are singular.
{% enddocs %}

{% docs permissions__verb %}
The action verb for this permission.

Some common verbs include: `create`, `read`, `write`, `list`.
{% enddocs %}

{% docs permissions__object_id %}
An optional object ID to specialise the permission.

If this is not set the permission is generally for the entire class of objects, if it _is_ set then
the permission is _only_ for the specific object.
{% enddocs %}
