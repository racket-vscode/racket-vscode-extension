"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDefinitions = exports.getAllInitialCompletions = exports.checkLang = void 0;
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
function checkDefinitions(textDocument, completions) {
    //This functions will be optimized and changed in some ways. Now its a proof of concept
    const variablePattern = /(\Wdefine \w+ (\w+|\W)\W)/g;
    const functionPattern = "";
    const text = textDocument.getText();
    let newCompletions = [];
    text.match(variablePattern)?.forEach((elem) => {
        const name = elem.split(" ")[1];
        const val = elem.split(" ")[2].split(")")[0];
        newCompletions.push({ label: name, kind: node_1.CompletionItemKind.Variable, data: val });
    });
    let finalCompletions = [...new Set([...completions, ...newCompletions])];
    if (finalCompletions === null) {
        return false;
    }
    return finalCompletions;
}
exports.checkDefinitions = checkDefinitions;
//# sourceMappingURL=utils.js.map