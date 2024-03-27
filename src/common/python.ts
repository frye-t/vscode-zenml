// Copyright(c) ZenML GmbH 2024. All Rights Reserved.
// Licensed under the Apache License, Version 2.0(the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at:
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
// or implied.See the License for the specific language governing
// permissions and limitations under the License.

/* eslint-disable @typescript-eslint/naming-convention */
import { commands, Disposable, Event, EventEmitter, Uri } from 'vscode';
import { traceError, traceLog } from './log/logging';
import { PythonExtension, ResolvedEnvironment } from '@vscode/python-extension';
export interface IInterpreterDetails {
  path?: string[];
  resource?: Uri;
}

const onDidChangePythonInterpreterEvent = new EventEmitter<IInterpreterDetails>();
export const onDidChangePythonInterpreter: Event<IInterpreterDetails> =
  onDidChangePythonInterpreterEvent.event;

let _api: PythonExtension | undefined;
async function getPythonExtensionAPI(): Promise<PythonExtension | undefined> {
  if (_api) {
    return _api;
  }
  _api = await PythonExtension.api();
  return _api;
}

export async function initializePython(disposables: Disposable[]): Promise<void> {
  try {
    const api = await getPythonExtensionAPI();

    if (api) {
      disposables.push(
        api.environments.onDidChangeActiveEnvironmentPath(e => {
          onDidChangePythonInterpreterEvent.fire({ path: [e.path], resource: e.resource?.uri });
        })
      );

      traceLog('Waiting for interpreter from python extension.');
      onDidChangePythonInterpreterEvent.fire(await getInterpreterDetails());
    }
  } catch (error) {
    traceError('Error initializing python: ', error);
  }
}

export async function resolveInterpreter(
  interpreter: string[]
): Promise<ResolvedEnvironment | undefined> {
  const api = await getPythonExtensionAPI();
  return api?.environments.resolveEnvironment(interpreter[0]);
}

export async function getInterpreterDetails(resource?: Uri): Promise<IInterpreterDetails> {
  const api = await getPythonExtensionAPI();
  const environment = await api?.environments.resolveEnvironment(
    api?.environments.getActiveEnvironmentPath(resource)
  );
  if (environment?.executable.uri && checkVersion(environment)) {
    return { path: [environment?.executable.uri.fsPath], resource };
  }
  return { path: undefined, resource };
}

export async function getDebuggerPath(): Promise<string | undefined> {
  const api = await getPythonExtensionAPI();
  return api?.debug.getDebuggerPackagePath();
}

export async function runPythonExtensionCommand(command: string, ...rest: any[]) {
  await getPythonExtensionAPI();
  return await commands.executeCommand(command, ...rest);
}

export function checkVersion(resolved: ResolvedEnvironment | undefined): boolean {
  const version = resolved?.version;
  if (version?.major === 3 && version?.minor >= 8) {
    traceLog(`Python version ${version?.major}.${version?.minor}.${version?.micro} is supported.`);
    return true;
  }
  traceError(`Python version ${version?.major}.${version?.minor} is not supported.`);
  traceError(`Selected python path: ${resolved?.executable.uri?.fsPath}`);
  traceError('Supported versions are 3.8 and above.');
  return false;
}

export function isPythonVersonSupported(resolvedEnv: ResolvedEnvironment | undefined): {
  isSupported: boolean;
  message?: string;
} {
  const version = resolvedEnv?.version;

  if (version?.major === 3 && version?.minor >= 8) {
    return { isSupported: true };
  }

  const errorMessage = `Unsupported Python ${version?.major}.${version?.minor}; requires >= 3.8.`;
  return { isSupported: false, message: errorMessage };
}