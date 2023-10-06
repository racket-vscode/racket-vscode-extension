import {
	createConnection,
	TextDocuments,
	Diagnostic,
	Location,
	Definition,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentIdentifier,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
	TextEdit,
	HandlerResult,
	Hover,
	MarkupKind,
	TextDocumentChangeEvent,
	Position,
	HoverParams,
	DidOpenTextDocumentParams
} from 'vscode-languageserver/node';

import {
	TextDocument,
} from 'vscode-languageserver-textdocument';

import {getAllInitialCompletions, getWordRangeAtPosition } from './utils';
import { Parser } from './parser';
import { execPromise, itemDetailer } from './utils';
import { URI } from 'vscode-uri'
import fileUriToPath from 'file-uri-to-path';
import { RacketErrors } from './errors';
// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);
let completions : CompletionItem[] = getAllInitialCompletions();

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let canOptimize = false;
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
			completionProvider: {
				resolveProvider: true
			},
			hoverProvider : true
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
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			//connection.console.log('Workspace folder change event received.');
		});
	}

	
});


connection.onHover((params) : HandlerResult<Hover | null | undefined, void> => {
	const document = documents.get(params.textDocument.uri);
	if (typeof document == "undefined") {
		return null;
	}

	if (canOptimize == false){
		completions = new Parser(document, completions).parseEverything();
		canOptimize = true;
	}
	
	const position = params.position;
	const wordRange = getWordRangeAtPosition(document, position);
	if (!wordRange) {
		return null;
	}

	const word = document.getText(wordRange);
	let data = undefined
	
	for (let i = 0; i < completions.length; i++){
		if (completions[i].label == word && completions[i].kind != 14 ){
			data = completions[i].data
		}
	}
	if (typeof data != 'undefined'){
		let markdown = ['```scheme',`${data}`, '```'].join('\n');
		return {
			contents: { kind : "markdown", value: markdown},
			range: wordRange,
		};
	}

	return null;
});

// The example settings
interface ExampleSettings {
	maxNumberOfProblems: number;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ExampleSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <ExampleSettings>(
			(change.settings.languageServerExample || defaultSettings)
		);
	}

	// Revalidate all open text documents
	documents.all().forEach(validateRacketDocument);
});

function getDocumentSettings(resource: string): Thenable<ExampleSettings> {
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
	completions = new Parser(change.document, completions).parseEverything();
	canOptimize = true;
	validateRacketDocument(change.document);
});


async function validateRacketDocument(textDocument: TextDocument): Promise<void> {
	const diagnostics = new RacketErrors(textDocument).scanFile();
	console.log(diagnostics);
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics})
}

connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		const document = documents.get(_textDocumentPosition.textDocument.uri)
		if (document !== undefined){
			
		
			return new Parser(document,completions).parseEverything()
			
		} else {
			throw Error("Unknown file")
		}
	}
);


// This handler resolves additional information for the item selected in
// the completion list.

//here i need to add some kind of env
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		return itemDetailer(item);
	}
);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
