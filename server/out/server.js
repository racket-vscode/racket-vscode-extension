"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const utils_1 = require("./utils");
const parser_1 = require("./parser");
const utils_2 = require("./utils");
const file_uri_to_path_1 = __importDefault(require("file-uri-to-path"));
// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
let completions = (0, utils_1.getAllInitialCompletions)();
// Create a simple text document manager.
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
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
            definitionProvider: true,
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
connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        // Register for all configuration changes.
        connection.client.register(node_1.DidChangeConfigurationNotification.type, undefined);
    }
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(_event => {
            connection.console.log('Workspace folder change event received.');
        });
    }
});
connection.onHover((handler) => {
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
    documents.all().forEach(validateTextDocument);
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
    validateTextDocument(change.document);
});
async function validateTextDocument(textDocument) {
    // In this simple example we get the settings for every validate run.
    const diagnostics = [];
    const output = await (0, utils_2.execPromise)(`racket "${(0, file_uri_to_path_1.default)(decodeURIComponent(textDocument.uri))}"`);
    console.log((0, file_uri_to_path_1.default)(decodeURIComponent(textDocument.uri)));
    console.log(output);
    if (typeof output === "string") {
        const info = output.split('\n')[0];
        let start = 0;
        let pos = 0;
        console.log(output.split('\n')[0].split(":"));
        if (info == "") {
            connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
        }
        else {
            console.log(info);
            if (output.split('\n')[0].split(":")[2] != null) {
                start = Number(output.split('\n')[0].split(":")[1]) - 1;
                pos = Number(output.split('\n')[0].split(":")[2]);
            }
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Error,
                message: info,
                range: {
                    start: node_1.Position.create(start, pos),
                    end: node_1.Position.create(start, pos)
                },
                source: `${textDocument.uri.split('/').at(-1)}`
            });
            connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
        }
    }
}
connection.onDidChangeWatchedFiles(_change => {
    // Monitored files have change in VSCode
    connection.console.log('We received an file change event');
});
// This handler provides the initial list of the completion items.
connection.onCompletion((_textDocumentPosition) => {
    // The pass parameter contains the position of the text document in
    // which code complete got requested. For the example we ignore this
    // info and always provide the same completion items.
    const document = documents.get(_textDocumentPosition.textDocument.uri);
    if (document !== undefined) {
        // TO DO: Get rid of repetition bug
        const parser = new parser_1.Parser(document, completions);
        return parser.parseEverything();
    }
    else {
        throw Error("Unknown file");
    }
});
// This handler resolves additional information for the item selected in
// the completion list.
//here i need to add some kind of env
connection.onCompletionResolve((item) => {
    if (item.data === 1) {
        item.detail = '#lang <lang>';
        item.documentation = 'You should input language name in place <lang>';
    }
    else if (item.data === 2) {
        item.detail = 'define <expr>';
        item.documentation = "define let's you define a function, or preety much anything";
    }
    else if (item.data == 3) {
        item.detail = 'provide';
        item.documentation = 'random';
    }
    else if (item.data == 4) {
        item.detail = 'max';
        item.documentation = 'in racket : (max exp exp ...) in plait : (max arg1 arg2)';
    }
    return (0, utils_2.itemDetailer)(item);
});
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map