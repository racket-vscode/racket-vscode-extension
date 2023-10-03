import {
	Diagnostic,
	DiagnosticSeverity,
	CompletionItem,
	CompletionItemKind
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

export function checkLang(textDocument : TextDocument)  : Diagnostic | false {

	const langPattern = /(#lang+ )\w+/g;
	if (!langPattern.test(textDocument.getText())){
		const diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Error,
			range: {
				start: textDocument.positionAt(0),
				end: textDocument.positionAt(5)
			},
			message: `#lang <language> is required to compile .rkt files`,
			source: `${textDocument.uri.split('/').at(-1)}`
		};
		return diagnostic

	}
	return false

}

export function getAllInitialCompletions() : CompletionItem[] {
	return [
		{
			label: 'lang',
			insertText : "#lang",
			kind: CompletionItemKind.Keyword,
			data: 1
		},
		{
			label: 'define',
			kind: CompletionItemKind.Keyword,
			data: 2
		},
		{
			label: 'provide',
			kind: CompletionItemKind.Keyword,
			data: 3
		},
		{
			label : 'max',
			kind : CompletionItemKind.Function,
			data : 4
		}
	];

}

function checkEnvironment(variableName : string, environment : CompletionItem[] ) : Boolean{
	// TODO : Remove collisions, create structures to operate quickly.

	environment.forEach((elem, index) => {
		if (elem.label == variableName){
			return true;
		}
	});
	return false;
}