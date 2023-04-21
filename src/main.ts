import * as core from '@actions/core';
import * as tcr from '@actions/tool-cache';
import os from 'os';
import * as finder from './finder';
import * as tc from './tool-cache';
import * as installer from './installer';
import * as mm from './manifest';
import * as utils from './utils';
import path from 'path';

export async function run() {
  try {
    const versionSpec = core.getInput('swift-version', { required: true });
    const arch = core.getInput('architecture') || os.arch();

    if (versionSpec.length === 0) {
      core.setFailed('Missing `swift-version`.');
    }

    const manifest = await mm.resolve(
      versionSpec,
      process.platform == 'linux'
        ? utils.getLinuxDistribID()
        : process.platform,
      arch,
      process.platform == 'linux'
        ? utils.getLinuxDistribRelease()
        : process.platform == 'darwin'
        ? ''
        : '10'
    );

    const release = manifest.files[0];

    let toolPath = await finder.find(manifest, arch);

    if (!toolPath) {
      await installer.install(manifest.version, release);
      toolPath = tc.find('swift', manifest.version, arch);
      if (toolPath.length) {
        toolPath = path.join(toolPath, '/usr/bin');
      }
    }

    if (!toolPath) {
      throw new Error(
        [
          `Version ${versionSpec} with platform ${
            process.platform == 'linux'
              ? utils.getLinuxDistribID()
              : process.platform
          } not found`,
          `The list of all available versions can be found here: https://www.swift.org/download`
        ].join(os.EOL)
      );
    }

    await installer.exportVariables(manifest.version, release, toolPath);
  } catch (err) {
    core.setFailed((err as Error).message);
  }
}
