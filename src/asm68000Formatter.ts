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

            // Calcula la cantidad de espacios necesarios para que el comentario comience en la columna correcta
            const columnForCommentShort = 35;
            const columnForCommentLong = 60;
            const tabSize = 4;
            const lineWithoutComment = `${initialSpaces}${instruction.toLowerCase()}.${modifier.toLowerCase()}${commandOperandSpace}${formattedOperands}`;
            const lineLength = lineWithoutComment.replace(/\t/g, ' '.repeat(tabSize)).length;
            
            let columnForComment;
            if (lineLength < 31) {
                columnForComment = columnForCommentShort;
            } else if (lineLength < 56) {
                columnForComment = columnForCommentLong;
            }

            const spacesNeeded = columnForComment ? columnForComment - lineLength : 0;
            const spacesForAlignment = spacesNeeded > 0 ? ' '.repeat(spacesNeeded) : ' '.repeat(4);

            const formattedComment = comment ? spacesForAlignment + comment : '';
            return `${lineWithoutComment}${formattedComment}`;
        });
    }
}
