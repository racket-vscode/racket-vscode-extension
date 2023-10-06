import { Diagnostic, DiagnosticSeverity, Position} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import XRegExp from 'xregexp';



export class RacketErrors {

	globalTextFile : TextDocument;
	globalParsedProgram : string[];
	
	constructor(text : TextDocument){
		this.globalTextFile = text;
		// If parentasee is unclosed, we will get an error, we should log it.
		try {
			this.globalParsedProgram = XRegExp.matchRecursive(this.globalTextFile.getText(), '\\(', '\\)', 'g');
		} catch (error) {
			console.log(error);
			this.globalParsedProgram = [""]
			return;
		}
		
	}

	public scanDefinitions() : Diagnostic[]{

		let newErrors : Diagnostic[] = [];
		
		this.globalParsedProgram.forEach((elem) => {
			const parsedExpression = elem.trim().replace(/\s\s+/g, ' ');
			const parsedSplitExpression = parsedExpression.split(" ");
			console.log(parsedExpression);
			if (parsedSplitExpression[0] == "define" && parsedSplitExpression[1][0] !== "(" && parsedSplitExpression[2][0] !== "("){
				
			} 
			if (parsedSplitExpression[0] == "define" && parsedSplitExpression[1][0] !== "(" && parsedSplitExpression[2][0] == "("){
				
			} 
		});
		
	
		return newErrors;
	}

	public scanFile() : Diagnostic[]{
		
		return [...this.scanDefinitions()].concat({
			severity: DiagnosticSeverity.Error,
			message : "test",
			range: {
			start: Position.create(1, 1),
			end: Position.create(1, 1)
			},
			source: `${this.globalTextFile.uri.split('/').at(-1)}`
		})
	}
}

