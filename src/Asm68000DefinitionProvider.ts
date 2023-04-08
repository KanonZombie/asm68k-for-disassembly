import * as vscode from 'vscode';

export class Asm68000DefinitionProvider implements vscode.DefinitionProvider {
    private cachedAsmFiles: vscode.Uri[] | undefined;

    constructor() {
        const fileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*.asm');
        
        fileSystemWatcher.onDidCreate(uri => this.updateCachedAsmFiles(uri, 'create'));
        fileSystemWatcher.onDidChange(uri => this.updateCachedAsmFiles(uri, 'change'));
        fileSystemWatcher.onDidDelete(uri => this.updateCachedAsmFiles(uri, 'delete'));
    }

    private async updateCachedAsmFiles(uri: vscode.Uri, action: 'create' | 'change' | 'delete'): Promise<void> {
        if (!this.cachedAsmFiles) {
            return;
        }

        if (action === 'create' || action === 'change') {
            const index = this.cachedAsmFiles.findIndex(file => file.toString() === uri.toString());
            if (index === -1) {
                this.cachedAsmFiles.push(uri);
            }
        } else if (action === 'delete') {
            this.cachedAsmFiles = this.cachedAsmFiles.filter(file => file.toString() !== uri.toString());
        }
    }

    private async getAsmFiles(): Promise<vscode.Uri[]> {
        if (!this.cachedAsmFiles) {
            this.cachedAsmFiles = await vscode.workspace.findFiles('**/*.asm', '**/node_modules/**', 100000);
        }
        return this.cachedAsmFiles;
    }

    async provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Location | undefined> {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return undefined;
        }

        const word = document.getText(wordRange);
        if (!word) {
            return undefined;
        }
        
        const initialPosition = position.translate(0,position.character*-1);
        const nextCharPosition = initialPosition.translate(0, word.length);
        const nextChar = document.getText(new vscode.Range(nextCharPosition, nextCharPosition.translate(0, 1)));
        if (nextChar === ':') {
            return new vscode.Location(document.uri, new vscode.Range(initialPosition, nextCharPosition));
        }
        
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder) {
            return undefined;
        }

        const asmFiles = await this.getAsmFiles();

        for (const file of asmFiles) {
            const fileContent = (await vscode.workspace.openTextDocument(file)).getText();
            const labelDefinitionRegex = new RegExp(`^${word}:`, 'm');
            const match = fileContent.match(labelDefinitionRegex);

            if (match) {
                const targetDocument = await vscode.workspace.openTextDocument(file);
                const startPosition = targetDocument.positionAt(match.index ?? 0);
                const endPosition = startPosition.translate(0, word.length);
                return new vscode.Location(targetDocument.uri, new vscode.Range(startPosition, endPosition));
            }
        }

        return undefined;
    }
}
