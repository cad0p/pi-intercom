// ui/compose.ts
import type { Component, TUI } from "@mariozechner/pi-tui";
import { truncateToWidth } from "@mariozechner/pi-tui";
import type { KeybindingsManager, Theme } from "@mariozechner/pi-coding-agent";
import type { IntercomClient } from "../broker/client.js";
import type { SessionInfo } from "../types.js";

export interface ComposeResult {
  sent: boolean;
  messageId?: string;
  text?: string;
}

export class ComposeOverlay implements Component {
  private tui: TUI;
  private theme: Theme;
  private keybindings: KeybindingsManager;
  private target: SessionInfo;
  private targetLabel: string;
  private client: IntercomClient;
  private done: (result: ComposeResult) => void;
  private inputBuffer: string = "";
  private sending: boolean = false;
  private error: string | null = null;

  constructor(
    tui: TUI,
    theme: Theme,
    keybindings: KeybindingsManager,
    target: SessionInfo,
    targetLabel: string,
    client: IntercomClient,
    done: (result: ComposeResult) => void,
  ) {
    this.tui = tui;
    this.theme = theme;
    this.keybindings = keybindings;
    this.target = target;
    this.targetLabel = targetLabel;
    this.client = client;
    this.done = done;
  }

  invalidate(): void {}

  handleInput(data: string): void {
    if (this.sending) return;
    // Handle escape key (cancel)
    if (this.keybindings.matches(data, "tui.select.cancel")) {
      this.done({ sent: false });
      return;
    }

    // Ignore other escape sequences (arrows, function keys, etc.)
    // These start with ESC but have additional characters
    if (data.startsWith("\x1b")) {
      return;
    }

    if (this.keybindings.matches(data, "tui.select.confirm")) {
      // Enter - send if we have content
      if (this.inputBuffer.trim()) {
        this.sendMessage();
      }
      return;
    }

    if (this.keybindings.matches(data, "tui.editor.deleteCharBackward")) {
      // Backspace
      this.inputBuffer = [...this.inputBuffer].slice(0, -1).join("");
      this.tui.scheduleRender();
      return;
    }

    // Regular character input (handles both single chars and paste)
    // Use spread operator to properly handle Unicode (including emoji)
    const printable = [...data].filter(c => c >= " ").join("");
    if (printable) {
      this.inputBuffer += printable;
      this.tui.scheduleRender();
    }
  }

  private async sendMessage(): Promise<void> {
    this.sending = true;
    this.error = null;
    this.tui.scheduleRender();

    try {
      const result = await this.client.send(this.target.id, {
        text: this.inputBuffer.trim(),
      });
      
      // Check if delivery actually succeeded
      if (!result.delivered) {
        this.error = result.reason ?? "Message not delivered. Session may not exist or has disconnected.";
        this.sending = false;
        this.tui.scheduleRender();
        return;
      }
      
      this.done({ 
        sent: true, 
        messageId: result.id,
        text: this.inputBuffer.trim(),
      });
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
      this.sending = false;
      this.tui.scheduleRender();
    }
  }

  render(width: number): string[] {
    const lines: string[] = [];
    const borderWidth = Math.max(0, Math.min(width - 4, 60));
    const footer = `  ${this.keybindings.getKeys("tui.select.confirm").join("/")}: Send • ${this.keybindings.getKeys("tui.select.cancel").join("/")}: Close`;

    // Header
    lines.push(truncateToWidth(this.theme.fg("accent", "━".repeat(borderWidth)), width));
    lines.push(truncateToWidth(this.theme.bold(`  Send to: ${this.targetLabel}`), width));
    lines.push(truncateToWidth(this.theme.fg("dim", `  ${this.target.cwd} • ${this.target.model}`), width));
    lines.push(truncateToWidth(this.theme.fg("accent", "━".repeat(borderWidth)), width));
    lines.push("");

    // Input area
    if (this.sending) {
      lines.push(truncateToWidth(this.theme.fg("dim", "  Sending..."), width));
    } else if (this.error) {
      lines.push(truncateToWidth(this.theme.fg("error", `  Error: ${this.error}`), width));
      lines.push("");
      lines.push(truncateToWidth(`  > ${this.inputBuffer}█`, width));
    } else {
      lines.push(truncateToWidth(`  > ${this.inputBuffer}█`, width));
    }

    lines.push("");
    lines.push(truncateToWidth(this.theme.fg("dim", footer), width));

    return lines;
  }
}
