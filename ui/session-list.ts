// ui/session-list.ts
import type { Component } from "@mariozechner/pi-tui";
import { truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";
import type { KeybindingsManager, Theme } from "@mariozechner/pi-coding-agent";
import type { SessionInfo } from "../types.js";

function middleTruncate(text: string, maxWidth: number): string {
  if (visibleWidth(text) <= maxWidth) {
    return text;
  }
  if (maxWidth <= 3) {
    return truncateToWidth(text, maxWidth, "");
  }

  const chars = [...text];
  const targetSideWidth = Math.max(1, Math.floor((maxWidth - 1) / 2));

  let left = "";
  for (const char of chars) {
    if (visibleWidth(left + char) > targetSideWidth) break;
    left += char;
  }

  let right = "";
  for (const char of chars.slice().reverse()) {
    if (visibleWidth(char + right) > targetSideWidth) break;
    right = char + right;
  }

  return truncateToWidth(`${left}…${right}`, maxWidth, "");
}

export class SessionListOverlay implements Component {
  private theme: Theme;
  private keybindings: KeybindingsManager;
  private done: (result: SessionInfo | undefined) => void;
  private sessions: SessionInfo[];
  private labels = new Map<string, string>();
  private selectedIndex = 0;
  private maxVisible = 8;

  constructor(
    theme: Theme,
    keybindings: KeybindingsManager,
    sessions: SessionInfo[],
    duplicateNames: Set<string>,
    done: (result: SessionInfo | undefined) => void,
  ) {
    this.theme = theme;
    this.keybindings = keybindings;
    this.sessions = sessions;
    this.done = done;

    for (const session of sessions) {
      const label = session.name
        ? duplicateNames.has(session.name.toLowerCase())
          ? `${session.name} (${session.id.slice(0, 8)})`
          : session.name
        : `Session ${session.id.slice(0, 8)}`;
      this.labels.set(session.id, label);
    }
  }

  private onSessionSelect(sessionId: string): void {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) return;
    this.done(session);
  }

  invalidate(): void {}

  handleInput(data: string): void {
    if (this.keybindings.matches(data, "tui.select.cancel")) {
      this.done(undefined);
      return;
    }

    if (this.sessions.length === 0) {
      return;
    }

    if (this.keybindings.matches(data, "tui.select.up")) {
      this.selectedIndex = this.selectedIndex === 0 ? this.sessions.length - 1 : this.selectedIndex - 1;
      return;
    }

    if (this.keybindings.matches(data, "tui.select.down")) {
      this.selectedIndex = this.selectedIndex === this.sessions.length - 1 ? 0 : this.selectedIndex + 1;
      return;
    }

    if (this.keybindings.matches(data, "tui.select.confirm")) {
      const session = this.sessions[this.selectedIndex];
      if (session) {
        this.onSessionSelect(session.id);
      }
    }
  }

  render(width: number): string[] {
    const innerWidth = Math.max(36, Math.min(width - 2, 88));
    const contentWidth = Math.max(1, innerWidth - 2);
    const footer = `${this.keybindings.getKeys("tui.select.confirm").join("/")}: Message • ${this.keybindings.getKeys("tui.select.cancel").join("/")}: Close`;
    const border = (text: string) => this.theme.fg("accent", text);
    const row = (text = "") => {
      const clipped = truncateToWidth(text, contentWidth, "", true);
      return `${border("│")}${clipped}${" ".repeat(Math.max(0, contentWidth - visibleWidth(clipped)))}${border("│")}`;
    };

    const lines: string[] = [];
    lines.push(border(`╭${"─".repeat(contentWidth)}╮`));
    lines.push(row(this.theme.bold(" Active Sessions")));
    lines.push(border(`├${"─".repeat(contentWidth)}┤`));
    lines.push(row());

    if (this.sessions.length === 0) {
      lines.push(row(this.theme.fg("dim", " No other intercom-connected sessions")));
    } else {
      const startIndex = Math.max(
        0,
        Math.min(this.selectedIndex - Math.floor(this.maxVisible / 2), this.sessions.length - this.maxVisible),
      );
      const endIndex = Math.min(startIndex + this.maxVisible, this.sessions.length);

      for (let index = startIndex; index < endIndex; index += 1) {
        const session = this.sessions[index];
        const label = this.labels.get(session.id) ?? `Session ${session.id.slice(0, 8)}`;
        const isSelected = index === this.selectedIndex;
        const prefix = isSelected ? this.theme.fg("accent", "→ ") : "  ";
        const labelText = `${label} ${this.theme.fg("dim", `(${session.model})`)}`;
        const pathText = middleTruncate(session.cwd, Math.max(8, contentWidth - 4));

        lines.push(row(`${prefix}${isSelected ? this.theme.fg("accent", labelText) : labelText}`));
        lines.push(row(`  ${this.theme.fg("dim", pathText)}`));
        if (index < endIndex - 1) {
          lines.push(row());
        }
      }

      if (startIndex > 0 || endIndex < this.sessions.length) {
        lines.push(row());
        lines.push(row(this.theme.fg("dim", ` ${this.selectedIndex + 1}/${this.sessions.length}`)));
      }
    }

    lines.push(row());
    lines.push(border(`├${"─".repeat(contentWidth)}┤`));
    lines.push(row(this.theme.fg("dim", ` ${footer}`)));
    lines.push(border(`╰${"─".repeat(contentWidth)}╯`));

    return lines;
  }
}
