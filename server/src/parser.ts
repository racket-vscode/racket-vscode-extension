import { CompletionItem, CompletionItemKind} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import XRegExp from 'xregexp';
import { changeOrAdd } from './utils';

/*
	Parse Idea.
	1. Get rid of new lines, everything is a space
	2. Get everything as an expression
	3. parse expressions recursively with respect to grammar
	4. Add environment
*/
export class Parser {

	globalTextFile : TextDocument;
	globalCompletions : CompletionItem[];
	globalParsedProgram : string[];

	constructor(text : TextDocument, completions : CompletionItem[]){
		this.globalTextFile = text;
		this.globalCompletions = completions;
		// If parentasee is unclosed, we will get an error, thus we wait for completion.
		try {
			this.globalParsedProgram = XRegExp.matchRecursive(this.globalTextFile.getText(), '\\(', '\\)', 'g');
		} catch (error) {
			this.globalParsedProgram = [""]
			return;
		}
		
	}

	public parseVariables() : CompletionItem[]{

		let newCompletions : CompletionItem[] = [];
		
		this.globalParsedProgram.forEach((elem) => {
			const parsedExpression = elem.trim().replace(/\s\s+/g, ' ');
			const parsedSplitExpression = parsedExpression.split(" ");
			console.log(parsedExpression);
			if (parsedSplitExpression[0] == "define" && parsedSplitExpression[1][0] !== "(" && parsedSplitExpression[2][0] !== "("){
				const name = parsedSplitExpression[1];
				newCompletions.push({label : name, kind : CompletionItemKind.Variable, data : `${name}: ${parsedSplitExpression[2]}`});
			} 
			if (parsedSplitExpression[0] == "define" && parsedSplitExpression[1][0] !== "(" && parsedSplitExpression[2][0] == "("){
				const name = parsedSplitExpression[1];
				try {
					const dataExpr = XRegExp.matchRecursive(parsedExpression,  '\\(', '\\)', 'g')
					newCompletions.push({label : name, kind : CompletionItemKind.Variable, data : `${name}: (${dataExpr})`});
				} catch (error) {}
			} 
		});
		
	
		return newCompletions;
	}

	public parseFunctions() : CompletionItem[]{
		
		let newCompletions : CompletionItem[] = [];
		
		this.globalParsedProgram.forEach((elem) => {
			const parsedExpression = elem.trim().replace(/\s\s+/g, ' ').split(" ");
			if ((parsedExpression[0] == "define" || parsedExpression[0] == "define/contract") && parsedExpression[1][0] == "("){
				let name;
				if (parsedExpression[1].length > 1){
					name = parsedExpression[1].substring(1);
					if (parsedExpression[1].slice(-1) == ")"){
						name = name.slice(0, -1);
					}
				} else {
					name = parsedExpression[2];
				}
				
				let preetierDefinition : string = "";
				for (let i = 0; i < parsedExpression.length; i++) {
					if (parsedExpression[i].slice(-1) == ")"){
						preetierDefinition += parsedExpression[i];
						break;
					}
					preetierDefinition += parsedExpression[i] + " ";
				}
				
				newCompletions.push({label : name, kind : CompletionItemKind.Function, data : `(${preetierDefinition} \n ...)`});
			} 
			
		});
		
		return newCompletions
	}

	public  parseEverything() : CompletionItem[]{
		const vars = this.parseVariables()
		const funcs = this.parseFunctions()
		const newCompletions = vars.concat(funcs);
		return changeOrAdd(newCompletions, this.globalCompletions)
	}
	

	
}

