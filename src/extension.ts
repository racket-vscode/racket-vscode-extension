// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { REPLProvider, setFilePermission } from "./replProvider";

function register(name : string, func : (...args : any []) => any) : vscode.Disposable {
	return vscode.commands.registerCommand(`racket-repl.${name}`, func);
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "racket-repl" is now active!');

	// Manages terminal and REPL.
	const manager = new REPLProvider();

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json

	// TODO: let vs const
	// TODO: you can probably replace registerTextEditorCommand in run with registerCommmand, the difference between registerCommand and registerTextEditorCommand

	// register run command
	let run = vscode.commands.registerTextEditorCommand('racket-repl.run', (editor : vscode.TextEditor) => {
		const filePath : String = editor.document.fileName;

		// start REPL
		manager.run(filePath);

		// TODO: check if it works on Windows, because they have a different sep

		// display a message box to the user containing the filename
		vscode.window.showInformationMessage('Running: ' + filePath.substring(filePath.lastIndexOf('/') + 1));
	});

	// register stop command
	let stop = vscode.commands.registerCommand('racket-repl.stop', () => {
		// stop REPL
		manager.stop();
	});

	// register runSelectionInREPL command
	let runSelectionInREPL = vscode.commands.registerCommand('racket-repl.runSelectionInREPL', () => {
		manager.runSelectionInREPL();
	});

	// register loadFileInREPL command
	let loadFileInREPL = vscode.commands.registerCommand('racket-repl.loadFileInREPL', () => {
		manager.loadFileInREPL();
	});

	// register runFileInTerminal command
	let runFileInTerminal = vscode.commands.registerCommand('racket-repl.runFileInTerminal', () => {
		manager.runFileInTerminal();
	});

	// set file permissions for scripts
	setFilePermission();

	// works without subscription, but in other REPLs they put everything there
	context.subscriptions.push();
}

// This method is called when your extension is deactivated
export function deactivate() {}
