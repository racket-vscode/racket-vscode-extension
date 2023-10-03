"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllInitialCompletions = exports.checkLang = void 0;
const node_1 = require("vscode-languageserver/node");
function checkLang(textDocument) {
    const langPattern = /(#lang+ )\w+/g;
    if (!langPattern.test(textDocument.getText())) {
        const diagnostic = {
            severity: node_1.DiagnosticSeverity.Error,
            range: {
                start: textDocument.positionAt(0),
                end: textDocument.positionAt(5)
            },
            message: `#lang <language> is required to compile .rkt files`,
            source: `${textDocument.uri.split('/').at(-1)}`
        };
        return diagnostic;
    }
    return false;
}
exports.checkLang = checkLang;
function getAllInitialCompletions() {
    return [
        {
            label: 'lang',
            insertText: "#lang",
            kind: node_1.CompletionItemKind.Keyword,
            data: 1
        },
        {
            label: 'define',
            kind: node_1.CompletionItemKind.Keyword,
            data: 2
        },
        {
            label: 'provide',
            kind: node_1.CompletionItemKind.Keyword,
            data: 3
        },
        {
            label: 'max',
            kind: node_1.CompletionItemKind.Function,
            data: 4
        }
    ];
}
exports.getAllInitialCompletions = getAllInitialCompletions;
function checkEnvironment(variableName, environment) {
    // TODO : Remove collisions, create structures to operate quickly.
    environment.forEach((elem, index) => {
        if (elem.label == variableName) {
            return true;
        }
    });
    return false;
}
//# sourceMappingURL=utils.js.map