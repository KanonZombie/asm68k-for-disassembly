import * as vscode from 'vscode';

export class Asm68000Formatter implements vscode.DocumentFormattingEditProvider {
    provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        options: vscode.FormattingOptions,
        token: vscode.CancellationToken
    ): vscode.TextEdit[] {

        const edits: vscode.TextEdit[] = [];

        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);

            // Ignora las líneas vacías
            if (line.isEmptyOrWhitespace) {
                continue;
            }

            const additionalFormattedLine = this.additionalFormatting(line.text, document);
            const formattedLine = this.formatLineDC(additionalFormattedLine);
            const edit = vscode.TextEdit.replace(line.range, formattedLine);
            edits.push(edit);
        }
    
        return edits;
        
        //const edits: vscode.TextEdit[] = [];

        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);

            // Ignora las líneas vacías
            if (line.isEmptyOrWhitespace) {
                continue;
            }

            const originalText = line.text;
            const formattedText = this.formatLineDC(originalText);

            if (originalText !== formattedText) {
                const range = new vscode.Range(line.range.start, line.range.end);
                const edit = vscode.TextEdit.replace(range, formattedText);
                edits.push(edit);
            }
        }

        return edits;
    }

    private additionalFormatting(line: string, document: vscode.TextDocument): string {
        const options = vscode.workspace.getConfiguration('editor', document.uri);
        const insertSpaces = options.get<boolean>('insertSpaces');
        const tabSize = options.get<number>('tabSize');
        
        const leadingWhitespace = line.match(/^\s*/)?.[0] ?? '';
    
        let newIndentation = '';
        if (insertSpaces) {
            newIndentation = ' '.repeat( (tabSize ?? 4 )* leadingWhitespace.length);
        } else {
            newIndentation = '\t'.repeat(Math.ceil(leadingWhitespace.length / (tabSize ?? 4 )));
        }
    
        return line.replace(/^\s*/, newIndentation);
    }
    
    private formatLineDC(line: string): string {
        // Convierte las instrucciones a mayúsculas y elimina los espacios adicionales alrededor de los operandos
        // Coincide con las instrucciones y los operandos según las especificaciones
        return line.replace(/^(\s*)(dc|dcb)\.([sbwlSBWL])(\s+)([^;]+)(\s*;.*)?$/, (match, initialSpaces, instruction, modifier, commandOperandSpace, operands, comment) => {
            const formattedOperands = operands.trim().replace(/\s{2,}/g, ' ');
            const formattedComment = comment ? '\t' + comment : '';
            return `${initialSpaces}${instruction.toLowerCase()}.${modifier.toLowerCase()}${commandOperandSpace}${formattedOperands}${formattedComment}`;
        });
    }
}
