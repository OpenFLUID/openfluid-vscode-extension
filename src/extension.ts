
import * as vscode from 'vscode';
import * as openfluid from './openfluid';


export function activate(context: vscode.ExtensionContext) {
    
    console.log('OpenFLUID extension is now active');

    context.subscriptions.push(vscode.commands.registerCommand('openfluid.getVersion', () => {
        const version = openfluid.getVersion();

        if (version.length > 0) {
            vscode.window.showInformationMessage(`OpenFLUID version ${version}`);
        }
        else {
            vscode.window.showErrorMessage(`OpenFLUID software not found`);
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('openfluid.createSimulator', () => {
        openfluid.createWare("simulator");
    }));

    context.subscriptions.push(vscode.commands.registerCommand('openfluid.createObserver', () => {
        openfluid.createWare("observer");
    }));

    context.subscriptions.push(vscode.commands.registerCommand('openfluid.createBuilderext', () => {
        openfluid.createWare("builderext");
    }));
}

export function deactivate() {}
