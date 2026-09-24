# Initialise database during facility setup wizard

## Show first sync progress on the setting-up screen
<!-- mockups: setting-up-screen -->

Give the facility setting-up screen a progress bar and a sense of how long the first sync will take, like the one mobile shows during its first sync. The sync process already tracks how many records it has to pull and how many it has pulled so far, but it runs separately from the API process in production, so the progress has to be sent to the API over the existing TCP connection before the web app can poll it. The step that saves pulled records into the database comes after the pull and can take a long time on its own, so it is reported as a separate stage rather than showing a bar stuck at full. This builds on the setting-up screen and state from the facility server setup spec.
