# Changelog

All notable changes to the `pi-intercom` extension will be documented in this file.

## [Unreleased]

### Added
- **`ask` action** — `intercom({ action: "ask", to, message })` now sends a message and blocks until the recipient replies, returning the reply as the tool result. Includes a 10-minute timeout, abort handling, disconnect handling, and shutdown cleanup.
- **Exact reply hints** — Incoming messages can now include a ready-to-run reply command that uses the sender's exact session ID as `to` and the original message ID as `replyTo`, making synchronous `ask`/reply flows reliable.
- **Attachment body rendering for incoming messages** — Incoming attachment contents are now appended to the agent-visible message body so recipients can read attached file/snippet/context content directly.
- **Planner/worker workflow documentation** — README now documents the intended planner-worker loop, including `send` vs `ask`, clarification patterns, and reply-hint behavior.

### Changed
- **Session target resolution** — `send` and `ask` now resolve a unique case-insensitive session name to its exact session ID before sending. Ambiguous names are rejected instead of guessed.
- **Duplicate-name presentation** — Session labels are now disambiguated consistently across `list`, the session picker, the compose overlay, and send notifications by appending a short session ID when names collide.
- **Send confirmation dialog** — Confirmation text now includes attachment content previews and `replyTo` metadata so outgoing messages are reviewed accurately before sending.
- **Inline message rendering** — The custom inline renderer now shows the fully rendered message body, optional reply command, attachment summaries, and reply metadata consistently with what the agent receives.

### Fixed
- **False `ask` completions from unrelated messages** — Reply matching now requires an exact `replyTo` match and the expected sender, preventing unrelated incoming messages from unblocking a waiting `ask`.
- **Self-targeted messages** — `send` and `ask` now reject attempts to message the current session instead of allowing loops or self-waits.
- **Undelivered `ask` cleanup** — If an `ask` message is not delivered, the waiting state is torn down cleanly instead of lingering.
- **Inline renderer/body mismatch** — The custom message renderer now matches the actual delivered message body for messages with attachments instead of showing a reduced view.
- **Duplicate-name ambiguity when self shares a name** — Duplicate-name detection now considers all connected sessions, so another session is still disambiguated when it shares a name with the current session.
- **`broker/client.ts` `sessions` switch scoping** — Braced the `sessions` case to avoid block-scoping hazards in the message handler.
