import {
	Diagnostic,
	DiagnosticSeverity,
	CompletionItem,
	CompletionItemKind,
	Definition
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

export function checkDefinitions(textDocument : TextDocument, completions : CompletionItem[]) : CompletionItem[] | false {

	//This functions will be optimized and changed in some ways. Now its a proof of concept

	const variablePattern = /(\Wdefine \w+ (\w+|\W)\W)/g;
	const functionPattern = "";
	const text = textDocument.getText();
	let newCompletions : CompletionItem[] = [];

	text.match(variablePattern)?.forEach((elem) => {
		const name = elem.split(" ")[1];
    	const val = elem.split(" ")[2].split(")")[0];
		newCompletions.push({label : name, kind : CompletionItemKind.Variable, data : val});
	});
	

	let finalCompletions = [... new Set([...completions, ...newCompletions])];
	
	if (finalCompletions === null){
		return false;
	}

	return finalCompletions;
	
}