// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Asm68000DefinitionProvider } from './Asm68000DefinitionProvider';
import { Asm68000ReferenceProvider } from './Asm68000ReferenceProvider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    const definitionProvider = new Asm68000DefinitionProvider();
    const referenceProvider = new Asm68000ReferenceProvider();

    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider({ language: 'asm68k' }, definitionProvider),
        vscode.languages.registerReferenceProvider({ language: 'asm68k' }, referenceProvider)
    );

}

// This method is called when your extension is deactivated
export function deactivate() { }
