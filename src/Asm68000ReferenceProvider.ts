import * as vscode from 'vscode';

export class Asm68000ReferenceProvider implements vscode.ReferenceProvider {
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

    async provideReferences(document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext, token: vscode.CancellationToken): Promise<vscode.Location[] | undefined> {
        const labelPattern = /^(?<label>\w+):/gm;
        const referencePattern = /\b(?<reference>\w+)\b/gm;

        const label = document.getText(document.getWordRangeAtPosition(position));
        if (!label) {
            return undefined;
        }

        const references: vscode.Location[] = [];

        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder) {
            return undefined;
        }

        const asmFiles = await this.getAsmFiles();

        for (const file of asmFiles) {
            const fileDocument = await vscode.workspace.openTextDocument(file);
            const text = fileDocument.getText();
            let match: RegExpExecArray | null;

            while ((match = labelPattern.exec(text)) !== null) {
                if (match.groups?.label === label) {
                    const referencePosition = fileDocument.positionAt(match.index);
                    const referenceRange = new vscode.Range(referencePosition, referencePosition.translate(0, label.length));
                    references.push(new vscode.Location(fileDocument.uri, referenceRange));
                }
            }

            while ((match = referencePattern.exec(text)) !== null) {
                if (match.groups?.reference === label) {
                    const referencePosition = fileDocument.positionAt(match.index);
                    const referenceRange = new vscode.Range(referencePosition, referencePosition.translate(0, label.length));
                    references.push(new vscode.Location(fileDocument.uri, referenceRange));
                }
            }
        }

        return references;
    }
}
