
import * as vscode from 'vscode';
import * as process from 'child_process';
import { existsSync } from 'fs';
import { env } from 'process';
import * as path from 'path';
import { sep } from 'path';


/**
  Executes a command using the correct OpenFLUID environment 
  @param cmd The command to execute
  @returns The standard output of the executed command
*/
function runOpenFLUIDCommand(cmd : string): Buffer {
    const config = vscode.workspace.getConfiguration('openfluid');
    var installPrefix : string | undefined = config.get('paths.installPrefix');
    var cEnv = env;
    
    if (installPrefix !== undefined && installPrefix.length > 0) {
      installPrefix = installPrefix.trim();

      cEnv.OPENFLUID_INSTALL_PREFIX=installPrefix;
      cEnv.PATH += `:${installPrefix}/bin`;
    }

    return process.execSync(cmd,{ env : cEnv });
}


/**
  Selects the workspace to use. If a file is active, the workspace of the file is returned, 
  else it opens a picker with available workspaces
  @param tryUseCurrent Set to true to try to use the current workspace, default is false
  @returns The path of the selected workspace
*/
async function selectWorkspacePath(tryUseCurrent: boolean = false): Promise<string | undefined | boolean> {
  var wksPath : string | undefined | boolean = undefined;

  if (tryUseCurrent && vscode.window.activeTextEditor !== undefined)
  {
    wksPath = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri)?.uri.path;
  }
  
  if (wksPath === undefined)
  {
    if (vscode.workspace.workspaceFolders !== undefined) {
        var availableWks : vscode.QuickPickItem[] = [];
        for (var folder of vscode.workspace.workspaceFolders) {
          availableWks.push({label: path.basename(folder.uri.path), detail: folder.uri.path});
        }

        await vscode.window.showQuickPick(availableWks, {
            placeHolder: 'Select workspace folder'
        })
        .then(item => {
            wksPath = item?.detail;
            if (wksPath === undefined) { // escaped by user
                wksPath = false;
            }
        });
    }
  }
  return wksPath;
}


/**
  Gets the version of the available OpenFLUID software
  @return The version string 
*/
export function getVersion() : string {
    try {
        return runOpenFLUIDCommand(`openfluid version`).toString();
    } catch (e) {
        return "";
    }
}


/**
  Creates a ware source tree of the given type 
  @param typeStr The type of ware, must be 'simulator', 'observer' or 'builderext'
*/
export async function createWare(typeStr : string) : Promise<void> {
    const wksPath = await selectWorkspacePath();

    if (wksPath !== false) {
        if (wksPath !== undefined) {
            const wksName = path.basename(<string>wksPath);
            vscode.window.showInputBox({ prompt: `Enter the ID of the ${typeStr} to create in ${wksName}`})
            .then(id => {
                if (id !== undefined) {
                    if (id.trim().length > 0) {
                        const parentPath = `${wksPath}/wares-dev/${typeStr}s`;
                        if (!existsSync(`${parentPath}/${id}`)) {
                            try {
                                const cmd = `openfluid create-ware --type=${typeStr} --id=${id} --parent-path=${parentPath}`;
                                runOpenFLUIDCommand(cmd);
                            } catch (e) {
                                vscode.window.showErrorMessage(`Error during creation of ${typeStr} ${id}`);
                            }
                        }
                        else {
                            vscode.window.showErrorMessage(`Unable to create ${typeStr} : ${id} already exists`);
                        }
                    }
                    else {
                        vscode.window.showErrorMessage(`Unable to create ${typeStr} : invalid ID`);
                    }
                }
            });
        }
        else {
            vscode.window.showErrorMessage(`Unable to create ${typeStr} : no workspace or folder open`);
        }
    }
}


/**
  Creates a project
*/
export async function createProject() : Promise<void> {
    const wksPath = await selectWorkspacePath();

    if (wksPath !== false) {
        if (wksPath !== undefined) {
            const wksName = path.basename(<string>wksPath);
            vscode.window.showInputBox({ prompt: `Enter the name of the project to create in ${wksName}`})
            .then(name => {
                if (name !== undefined) {
                    if (name.trim().length > 0) {
                        const parentPath = `${wksPath}/projects`;
                        if (!existsSync(`${parentPath}/${name}`)) {
                            try {
                                const cmd = `openfluid create-data --type=project --name=${name} --parent-path=${parentPath} --with-sample-data`;
                                runOpenFLUIDCommand(cmd);
                            } catch (e) {
                                vscode.window.showErrorMessage(`Error during creation of project ${name}`);
                            }
                        }
                        else {
                            vscode.window.showErrorMessage(`Unable to create project : ${name} already exists`);
                        }
                    }
                    else {
                        vscode.window.showErrorMessage(`Unable to create project : invalid name`);
                    }
                }
            });
        }
        else {
            vscode.window.showErrorMessage(`Unable to create project : no workspace or folder open`);
        }
    }
}

