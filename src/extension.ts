
import * as vscode from 'vscode';
import * as openfluid from './openfluid';


export function activate(context: vscode.ExtensionContext) {

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

    context.subscriptions.push(vscode.commands.registerCommand('openfluid.configureWare', () => {
        openfluid.configureWare();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('openfluid.buildWare', () => {
        openfluid.buildWare();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('openfluid.createProject', () => {
        openfluid.createProject();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('openfluid.runProject', () => {
        openfluid.runProject();
    }));

}


export function deactivate() {}
