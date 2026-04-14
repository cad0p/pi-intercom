# Changelog

All notable changes to the `pi-intercom` extension will be documented in this file.

## [Unreleased]

## [0.1.8] - 2026-04-14

### Changed
- Intercom sessions now reconnect automatically after broker disconnects or sleep/wake interruptions instead of staying offline until reload or restart.
- Replaced raw runtime `console.error` intercom disconnect logging with silent recovery so transient broker churn no longer splashes stray text into the Pi TUI.

## [0.1.7] - 2026-04-13

### Changed
- Unnamed sessions now register a runtime-only `subagent-chat-<id>` intercom alias instead of persisting a generic session title into Pi session history, so `pi --resume` can keep showing transcript snippets while unnamed sessions remain reachable over intercom.
- Intercom presence updates now refresh the advertised session name during later turn/intercom activity, so renaming a session does not leave subagents and peers targeting a stale startup alias.

## [0.1.6] - 2026-04-13

### Changed
- Busy incoming intercom messages now try a graceful detach handshake with `pi-subagents` before falling back to interrupting the active turn.
- Reply follow-ups are deferred and re-delivered as follow-up wakeups so final confirmation messages stop causing unnecessary `Operation aborted` interruptions.
- Unnamed sessions now auto-register a stable `session-<id>` display name so orchestrators and delegated children can target each other reliably without a manual `/name`.

## [0.1.5] - 2026-04-13

### Changed
- Switched intercom send confirmation to opt-in. `send` now delivers immediately by default, and interactive confirmation only appears when `confirmSend: true` is set in `~/.pi/agent/intercom/config.json`.
- Replaced the old inverted `autoSend` config with `confirmSend` to make the behavior easier to understand.

## [0.1.4] - 2026-04-13

### Added
- Added an MIT `LICENSE` file and set `package.json` `license` to `MIT`.

### Changed
- Updated `README.md` to mention the `pi-subagents` integration and link to https://github.com/nicobailon/pi-subagents.

## [0.1.3] - 2026-04-10

### Changed
- **Clearer self vs peer identity** — `intercom({ action: "list" })` now shows `Current session` and `Other sessions`, includes short session IDs, and marks same-folder peers with `[same cwd]` so agents are less likely to mistake another session in the same repo for themselves.
- **Picker self anchor** — The session picker now shows the current session as a disabled `[self]` row at the top while keeping only peer sessions selectable.

## [0.1.2] - 2026-04-04

### Changed
- **Reply flows skip approval** — `send` calls that include `replyTo` now bypass the confirmation dialog so reply-hint conversations can continue without an extra approval step.
- **Overlay readability** — The session picker now shows session name/model on the first line and the cwd on a second line with middle truncation, making long paths much easier to distinguish.
- **Documentation clarity** — The README now explains which sessions appear in the picker, how sessions become intercom-connected, and the difference between user-facing `/intercom` usage and agent tool calls.

### Fixed
- **Compose overlay crash** — Replaced the invalid `tui.scheduleRender()` calls with `tui.requestRender()`, fixing the compose overlay crash while typing or sending.
- **Overlay panel chrome** — Restored bordered modal rendering for the session picker and compose overlay so they display as proper overlays instead of floating unboxed content.

## [0.1.1] - 2026-04-04

### Changed
- Added a `promptSnippet` for the `intercom` tool so Pi 0.59+ includes it in the default tool prompt section and improves session-to-session coordination discoverability.

### Changed
- **Pi compatibility refresh** — Updated the extension to match current Pi lifecycle and custom UI APIs, including `session_start` / `session_shutdown` and injected `ctx.ui.custom()` keybindings.
- **Overlay keybindings** — The session picker and compose overlay now use injected, namespaced Pi keybindings instead of reading editor-global bindings directly.
- **Session list correlation** — `list` / `sessions` now carry a `requestId`, so a delayed broker reply cannot be mistaken for a newer session-list request.
- **Reply sends skip approval** — `send` calls that include `replyTo` now bypass the confirmation dialog so reply-hint flows work without an extra approval step.
- **Documentation accuracy** — The README now matches the current implementation, including request correlation, persistence behavior, broker disconnect behavior, and the file layout.

### Fixed
- **Protocol state handling** — Broker and client now reject malformed, unknown, duplicate, and out-of-order protocol messages instead of silently accepting them.
- **Duplicate-name routing** — Sends to a duplicated session name now fail with an explicit error instead of routing to the first match.
- **Delivery failure visibility** — `delivery_failed.reason` now flows through the client, tool results, and compose overlay error UI.
- **Disconnect and startup errors** — Broker spawn failures, early broker exits, protocol failures, and disconnects now preserve the real error instead of collapsing to generic messages.
- **Disconnect-time writes** — Client operations now fail cleanly during disconnect instead of writing to a closing socket and triggering `write after end` errors.
- **Late-response handling** — Timed-out send/list requests no longer disconnect the client, and delayed list responses can no longer contaminate a later request with stale data.
- **Config validation** — Invalid intercom config values are now reported and ignored instead of silently producing a broken runtime config.

## [0.1.0] - 2026-03-12

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
