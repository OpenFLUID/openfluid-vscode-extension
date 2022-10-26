
import * as vscode from 'vscode';
import * as process from 'child_process';
import { existsSync } from 'fs';
import { env } from 'process';
import * as path from 'path';


/**
  Returns a process environment, adapted with OpenFLUID path if defined in extension settings
  @return the process environment
*/
function getOpenFLUIDEnv(): any {
    const config = vscode.workspace.getConfiguration('openfluid');
    var installPrefix : string | undefined = config.get('paths.installPrefix');
    var cEnv = env;
    
    if (installPrefix !== undefined && installPrefix.length > 0) {
      installPrefix = installPrefix.trim();

      cEnv.OPENFLUID_INSTALL_PREFIX=installPrefix;
      cEnv.PATH += `:${installPrefix}/bin`;
    }

    return cEnv;
}


/**
  Executes a command using the adapted OpenFLUID environment
  @param cmd The command to execute
  @returns The standard output of the executed command
*/
function runOpenFLUIDCommand(cmd : string): Buffer {
    var cEnv = getOpenFLUIDEnv();

    return process.execSync(cmd,{ env : cEnv });
}


/**
  Executes a command in the OpenFLUID dedicated terminal using the adapted OpenFLUID environment
  @param cmd The command to execute in the terminal
  @param workPath The workpath in which the terminal is located (undefined by default)
*/
function runInOpenFLUIDTerminal(cmd : string, workPath : string | undefined = undefined): void {
     var terminal : vscode.Terminal | undefined = undefined;

    // close the OpenFLUID terminal if already open
    const terms = <vscode.Terminal[]>(<any>vscode.window).terminals;
    terminal = terms.find(items => items.name === "OpenFLUID"); 
    if (terminal !== undefined) {
        terminal.dispose();
    }
 
    const options : vscode.TerminalOptions = {
      name : "OpenFLUID",
      cwd : workPath,
      env: getOpenFLUIDEnv()
    };

    terminal = vscode.window.createTerminal(options);
    terminal.show(true);  // set focus to the OpenFLUID terminal

    terminal.sendText(`${cmd}`);
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
  Tries to detect the ware sources path corresponding to the current active text editor
  @returns The ware sources path if detected
*/
function detectWareSrcPath(): string | undefined {
    var detPath : string | undefined = undefined;

    if (vscode.window.activeTextEditor !== undefined) {
        var docPath = vscode.window.activeTextEditor.document.uri.path;
        var wksPath = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri)?.uri.path;

        const matchesPrj = docPath.match(`(${wksPath}/wares-dev/(simulators|observers|builderexts)/[a-zA-Z0-9\s\.]+).*`);
        if (matchesPrj) {
            detPath = matchesPrj[1];
        }
    }

    return detPath;
}


/**
  Tries to detect the project path corresponding to the current active text editor
  @returns The project path if detected
*/
function detectProjectPath(): string | undefined {
    var detPath : string | undefined = undefined;

    if (vscode.window.activeTextEditor !== undefined) {
        var docPath = vscode.window.activeTextEditor.document.uri.path;
        var wksPath = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri)?.uri.path;

        const matchesPrj = docPath.match(`(${wksPath}/projects/[a-zA-Z0-9\s]+).*`);
        if (matchesPrj) {
            detPath = matchesPrj[1];
        }
    }

    return detPath;
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
                        } else {
                            vscode.window.showErrorMessage(`Unable to create ${typeStr} : ${id} already exists`);
                        }
                    } else {
                        vscode.window.showErrorMessage(`Unable to create ${typeStr} : invalid ID`);
                    }
                }
            });
        } else {
            vscode.window.showErrorMessage(`Unable to create ${typeStr} : no workspace or folder open`);
        }
    }
}


/**
  Configures a ware, using the active editor to identify the ware
*/
export function configureWare() : void {
    var srcPath = detectWareSrcPath();

    if (srcPath !== undefined) {
        runInOpenFLUIDTerminal(`openfluid configure --path=${srcPath}`,srcPath);
    } else {
      vscode.window.showErrorMessage(`Unable to detect the ware to configure`);
    }
}


/**
  Builds a ware, using the active editor to identify the ware
*/
export function buildWare() : void {
    var srcPath = detectWareSrcPath();

    if (srcPath !== undefined) {
        runInOpenFLUIDTerminal(`openfluid build --path=${srcPath}`,srcPath);
    } else {
      vscode.window.showErrorMessage(`Unable to detect the ware to build`);
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
                        } else {
                            vscode.window.showErrorMessage(`Unable to create project : ${name} already exists`);
                        }
                    } else {
                        vscode.window.showErrorMessage(`Unable to create project : invalid name`);
                    }
                }
            });
        } else {
            vscode.window.showErrorMessage(`Unable to create project : no workspace or folder open`);
        }
    }
}


/**
  Runs a project, using the active editor to identify the project
*/
export function runProject() : void {
    var prjPath = detectProjectPath();

    if (prjPath !== undefined) {
        runInOpenFLUIDTerminal(`openfluid run ${prjPath}`,prjPath);
    } else {
      vscode.window.showErrorMessage(`Unable to detect the project to run`);
    }
}


