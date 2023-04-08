import { parentPort, workerData } from 'worker_threads';
import * as vscode from 'vscode';

export const searchReferences = async (label: string, fileUri: vscode.Uri): Promise<vscode.Location[]> => {
    const labelPattern = /^(?<label>\w+):/gm;
    const referencePattern = /\b(?<reference>\w+)\b/gm;
    const references: vscode.Location[] = [];
    const fileDocument = await vscode.workspace.openTextDocument(fileUri);
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

    return references;
};

(async () => {
    const results = await searchReferences(workerData.label, workerData.fileUri);
    parentPort?.postMessage(results);
})();
