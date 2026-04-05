{% docs ask_ai__table__conversations %}
Stores Ask AI chatbot conversation threads. Each conversation belongs to a single user and groups a sequence of messages. Conversations support soft-deletion via `deleted_at` so history can be recovered. Not synced between facility and central servers.
{% enddocs %}

{% docs ask_ai__conversations__id %}
Primary key. UUID string assigned by the application.
{% enddocs %}

{% docs ask_ai__conversations__user_id %}
Foreign key to `public.users.id`. The user who owns this conversation.
{% enddocs %}

{% docs ask_ai__conversations__title %}
Optional human-readable title for the conversation. Nullable — not set until the conversation has been given a name.
{% enddocs %}

{% docs ask_ai__conversations__created_at %}
Timestamp when the conversation was created.
{% enddocs %}

{% docs ask_ai__conversations__updated_at %}
Timestamp when the conversation was last modified.
{% enddocs %}

{% docs ask_ai__conversations__deleted_at %}
Soft-delete timestamp. Null when the conversation is active. Set when the conversation is deleted, allowing recovery if needed.
{% enddocs %}
