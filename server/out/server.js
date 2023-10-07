"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const utils_1 = require("./utils");
const parser_1 = require("./parser");
const utils_2 = require("./utils");
const errors_1 = require("./errors");
// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
let completions = (0, utils_1.getAllInitialCompletions)();
// Create a simple text document manager.
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
let canOptimize = false;
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;
connection.onInitialize((params) => {
    const capabilities = params.capabilities;
    // Does the client support the `workspace/configuration` request?
    // If not, we fall back using global settings.
    hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
    hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);
    hasDiagnosticRelatedInformationCapability = !!(capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation);
    const result = {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            // Tell the client that this server supports code completion.
            completionProvider: {
                resolveProvider: true
            },
            hoverProvider: true
        }
    };
    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true
            }
        };
    }
    return result;
});
connection.onInitialized((params) => {
    if (hasConfigurationCapability) {
        // Register for all configuration changes.
        connection.client.register(node_1.DidChangeConfigurationNotification.type, undefined);
    }
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(_event => {
            //connection.console.log('Workspace folder change event received.');
        });
    }
});
connection.onHover((params) => {
    const document = documents.get(params.textDocument.uri);
    if (typeof document == "undefined") {
        return null;
    }
    if (canOptimize == false) {
        completions = new parser_1.Parser(document, completions).parseEverything();
        canOptimize = true;
    }
    const position = params.position;
    const wordRange = (0, utils_1.getWordRangeAtPosition)(document, position);
    if (!wordRange) {
        return null;
    }
    const word = document.getText(wordRange);
    let data = undefined;
    for (let i = 0; i < completions.length; i++) {
        if (completions[i].label == word && completions[i].kind != 14) {
            data = completions[i].data;
        }
    }
    if (typeof data != 'undefined') {
        let markdown = ['```scheme', `${data}`, '```'].join('\n');
        return {
            contents: { kind: "markdown", value: markdown },
            range: wordRange,
        };
    }
    return null;
});
// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings = { maxNumberOfProblems: 1000 };
let globalSettings = defaultSettings;
// Cache the settings of all open documents
const documentSettings = new Map();
connection.onDidChangeConfiguration(change => {
    if (hasConfigurationCapability) {
        // Reset all cached document settings
        documentSettings.clear();
    }
    else {
        globalSettings = ((change.settings.languageServerExample || defaultSettings));
    }
    // Revalidate all open text documents
    documents.all().forEach(validateRacketDocument);
});
function getDocumentSettings(resource) {
    if (!hasConfigurationCapability) {
        return Promise.resolve(globalSettings);
    }
    let result = documentSettings.get(resource);
    if (!result) {
        result = connection.workspace.getConfiguration({
            scopeUri: resource,
            section: 'languageServerExample'
        });
        documentSettings.set(resource, result);
    }
    return result;
}
// Only keep settings for open documents
documents.onDidClose(e => {
    documentSettings.delete(e.document.uri);
});
// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
    completions = new parser_1.Parser(change.document, completions).parseEverything();
    canOptimize = true;
    validateRacketDocument(change.document);
});
async function validateRacketDocument(textDocument) {
    const diagnostics = await new errors_1.RacketErrorsHandler(textDocument).scanFile();
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}
connection.onCompletion((_textDocumentPosition) => {
    const document = documents.get(_textDocumentPosition.textDocument.uri);
    if (document !== undefined) {
        return new parser_1.Parser(document, completions).parseEverything();
    }
    else {
        throw Error("Unknown file");
    }
});
// This handler resolves additional information for the item selected in
// the completion list.
//here i need to add some kind of env
connection.onCompletionResolve((item) => {
    return (0, utils_2.itemDetailer)(item);
});
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map