
import * as vscode from 'vscode';
import * as process from 'child_process';
import { existsSync } from 'fs';
import { env } from 'process';


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
export function createWare(typeStr : string) : void {
    if(vscode.workspace.workspaceFolders !== undefined) {
        const wksPath  = vscode.workspace.workspaceFolders[0].uri.fsPath;
        vscode.window.showInputBox({ prompt: `Enter the ID of the ${typeStr} to create` })
        .then(id => {
            if (id !== undefined) {
                if (id.trim().length > 0) {
                    const parentPath = `${wksPath}/${typeStr}s`;
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