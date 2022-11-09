import * as core from "@actions/core";
import * as exec from "@actions/exec";

export function resolveVersionFromMessage(message: string): string {
  const match = message.match(
    /Swift\ version (?<version>[0-9]+\.[0-9+]+(\.[0-9]+)?)/
  ) || {
    groups: { version: null },
  };

  if (!match.groups || !match.groups.version) {
    return "";
  }

  return match.groups.version || "";
}

export async function resolveVersionFromCommandLine(commandLine: string) {
  let message = "";
  const options = {
    listeners: {
      stdout: (data: Buffer) => {
        message += data.toString().trim();
      },
      stderr: (data: Buffer) => {
        core.error(data.toString().trim());
      },
    },
  };

  await exec.exec(commandLine, ["--version"], options);

  return resolveVersionFromMessage(message);
}
