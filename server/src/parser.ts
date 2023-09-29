import { CompletionItem, CompletionItemKind} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import XRegExp from 'xregexp';

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

	public async parseVariables() : Promise<CompletionItem[]>{

		let newCompletions : CompletionItem[] = [];
		
		this.globalParsedProgram.forEach((elem) => {
			const parsedExpression = elem.trim().replace(/\s\s+/g, ' ').split(" ");
			if (parsedExpression[0] == "define" && parsedExpression[1][0] !== "("){
				const name = parsedExpression[1];
				newCompletions.push({label : name, kind : CompletionItemKind.Variable});
			} 
			
		});
		
		this.globalCompletions = [... new Set([...this.globalCompletions, ...newCompletions])];
		return this.globalCompletions;
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

		this.globalCompletions = [... new Set([...this.globalCompletions, ...newCompletions])];

		return this.globalCompletions;
	}

	public  parseEverything() : CompletionItem[]{
		this.parseVariables()
		return this.parseFunctions()
	}
	

	
}