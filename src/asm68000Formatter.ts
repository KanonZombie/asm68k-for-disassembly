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

            let formattedLine = this.additionalFormatting(line.text, document);
            formattedLine = this.alignOperands(formattedLine);
            formattedLine = this.formatInstructionAndOperands(formattedLine);
            formattedLine = this.alignComments(formattedLine);
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
            newIndentation = ' '.repeat((tabSize ?? 4) * leadingWhitespace.length);
        } else {
            newIndentation = '\t'.repeat(Math.ceil(leadingWhitespace.length / (tabSize ?? 4)));
        }

        return line.replace(/^\s*/, newIndentation);
    }

    private alignOperands(line: string): string {
        const firstNonWhitespaceIndex = line.search(/\S/);
        const instructionStartIndex = line.slice(firstNonWhitespaceIndex).search(/\s/);
        if (instructionStartIndex === -1) {
            // This line doesn't have an operand, so return it as is.
            return line;
        }

        if (line.trimStart().indexOf(';') === 0 || line.trimStart() === '') {
            // This line doesn't have an operand, so return it as is.
            return line;
        }

        const initialWhitespace = line.slice(0, firstNonWhitespaceIndex);
        const instruction = line.slice(firstNonWhitespaceIndex, firstNonWhitespaceIndex + instructionStartIndex);
        const operands = line.slice(firstNonWhitespaceIndex + instructionStartIndex).trim();

        // Calculate the number of spaces needed to align operands to the 15th column.
        const spacesNeeded = 10 - instruction.length;

        // If the instruction is longer than 14 characters, use a single space.
        const spacesForAlignment = spacesNeeded > 0 ? ' '.repeat(spacesNeeded) : ' ';

        return `${initialWhitespace}${instruction}${spacesForAlignment}${operands}`;
    }

    private formatInstructionAndOperands(line: string): string {
        return line.replace(/^(\s*)(dc|dcb)\.([sbwlSBWL])(\s+)([^;]+)(\s*;.*)?$/, (match, initialSpaces, instruction, modifier, commandOperandSpace, operands, comment) => {
            const formattedOperands = operands.trim();

            const formattedComment = comment ? comment : '';

            const formattedLine = `${initialSpaces}${instruction.toLowerCase()}.${modifier.toLowerCase()}${commandOperandSpace}${formattedOperands}${formattedComment}`;

            return formattedLine;
        });
    }

    private alignComments(originalLine: string): string {
        const columnForCommentShort = 35;
        const columnForCommentLong = 60;
        const tabSize = 4;
        const commentMatch = originalLine.match(/(.+?)(;.*)/);

        let lineWithoutComment = originalLine;
        let formattedComment = '';

        if (commentMatch) {
            const comment = commentMatch ? commentMatch[2] : '';

            lineWithoutComment = commentMatch ? commentMatch[1].trimEnd() : '';;
            const lineLength = lineWithoutComment.replace(/\t/g, ' '.repeat(tabSize)).length;

            let columnForComment;
            if (lineLength === 0) {
                return originalLine;
            }
            else if (lineLength < 31) {
                columnForComment = columnForCommentShort;
            } else if (lineLength < 56) {
                columnForComment = columnForCommentLong;
            }

            const spacesNeeded = columnForComment ? columnForComment - lineLength : 0;
            const spacesForAlignment = spacesNeeded > 0 ? ' '.repeat(spacesNeeded) : ' '.repeat(4);

            formattedComment = comment ? spacesForAlignment + comment : '';

        }

        return `${lineWithoutComment}${formattedComment}`;
    }
}
