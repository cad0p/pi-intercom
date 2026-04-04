// config.ts
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export interface IntercomConfig {
  /** Allow agent to send messages without confirmation */
  autoSend: boolean;
  
  /** Custom status shown to other sessions */
  status?: string;
  
  /** Enable/disable intercom (default: true) */
  enabled: boolean;
  
  /** Show reply hint in incoming messages (default: true) */
  replyHint: boolean;
}

const CONFIG_PATH = join(homedir(), ".pi/agent/intercom/config.json");

const defaults: IntercomConfig = {
  autoSend: false,
  enabled: true,
  replyHint: true,
};

export function loadConfig(): IntercomConfig {
  if (!existsSync(CONFIG_PATH)) {
    return { ...defaults };
  }
  
  try {
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("Config must be a JSON object");
    }

    const parsedConfig = parsed as Record<string, unknown>;
    const config: IntercomConfig = { ...defaults };

    if (Object.hasOwn(parsedConfig, "autoSend")) {
      if (typeof parsedConfig.autoSend !== "boolean") {
        throw new Error(`"autoSend" must be a boolean`);
      }
      config.autoSend = parsedConfig.autoSend;
    }

    if (Object.hasOwn(parsedConfig, "enabled")) {
      if (typeof parsedConfig.enabled !== "boolean") {
        throw new Error(`"enabled" must be a boolean`);
      }
      config.enabled = parsedConfig.enabled;
    }

    if (Object.hasOwn(parsedConfig, "replyHint")) {
      if (typeof parsedConfig.replyHint !== "boolean") {
        throw new Error(`"replyHint" must be a boolean`);
      }
      config.replyHint = parsedConfig.replyHint;
    }

    if (Object.hasOwn(parsedConfig, "status")) {
      if (typeof parsedConfig.status !== "string") {
        throw new Error(`"status" must be a string`);
      }
      config.status = parsedConfig.status;
    }

    return config;
  } catch (error) {
    console.error(`Failed to load intercom config at ${CONFIG_PATH}:`, error);
    return { ...defaults };
  }
}
