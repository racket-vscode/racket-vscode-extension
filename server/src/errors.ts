import { Diagnostic, DiagnosticSeverity, Position} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import XRegExp from 'xregexp';
import { sleep, execPromise} from './utils';
import fileUriToPath from 'file-uri-to-path';



export class RacketErrorsHandler {

	globalTextFile : TextDocument;
	
	constructor(text : TextDocument){
		this.globalTextFile = text;

	}

	public async scanFile() : Promise<Diagnostic[]>{
		await sleep(3000);
		const diagnostics: Diagnostic[] = [];
		const output = await execPromise(`racket "${fileUriToPath(decodeURIComponent(this.globalTextFile.uri))}"`);
		console.log(fileUriToPath(decodeURIComponent(this.globalTextFile.uri)));
		console.log(output);
		if (typeof output === "string"){
			const info = output.split('\n')[0]
			let start = 0
			let pos = 0
			console.log(output.split('\n')[0].split(":"));
				if (info == ""){
					return diagnostics ;
				} else {
					console.log(info);
					if (output.split('\n')[0].split(":")[2] != null){
						start = Number(output.split('\n')[0].split(":")[1]) - 1
						pos = Number(output.split('\n')[0].split(":")[2]) 
					
					}
					diagnostics.push({
						severity: DiagnosticSeverity.Error,
						message : info,
						range: {
							start: Position.create(start, pos),
							end: Position.create(start, pos)
						},
						source: `${this.globalTextFile.uri.split('/').at(-1)}`
					})
					return diagnostics;
				}
		}
		return [];
	}
}

