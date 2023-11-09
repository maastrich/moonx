import { emojify } from "node-emoji";

class Logger {
  public dump(
    type: "log" | "info" | "warn" | "error",
    message: string,
    prefix?: string,
  ) {
    if (!prefix) {
      console[type](emojify(message));
      return;
    }
    console[type](emojify(`${prefix} ${message}`));
  }

  public debugEnabled: boolean = false;

  public warn(message: string) {
    this.dump("warn", message, ":rotating_light:");
  }

  private counter: Record<string, number> = {};

  public count(message: string) {
    if (!this.counter[message]) {
      this.counter[message] = 0;
    }
    this.counter[message]++;
    return message.replace(/{count}/g, this.counter[message].toString());
  }

  public debug(message: string) {
    if (!this.debugEnabled) return;
    this.dump("log", message, ":bug:");
  }

  public error(message: string) {
    this.dump("error", message, ":x:");
  }

  public success(message: string) {
    this.dump("info", message, ":white_check_mark:");
  }

  public info(message: string) {
    this.dump("info", message, ":information_source:");
  }
}

export const logger = new Logger();
