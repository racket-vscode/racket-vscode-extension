// "use strict";

import * as vscode from "vscode";
import { exec } from "child_process";
import * as path from "path";
import * as os from "os";
import * as kill from "tree-kill";
// import * as is-running from 'is-running';

function getDir(filePath : String, sep : string) : String {
	return filePath.substring(0, filePath.lastIndexOf(sep));
}

function getFile(filePath : String, sep : string) : String {
	return filePath.substring(filePath.lastIndexOf(sep) + 1);
}

const sep = path.sep;
const os_type = os.platform();

// console.log(os_type);
// console.log(sep);
// console.log(__dirname);
// console.log(exec(`cd ${__dirname}`))

const pathToScripts : string = `${__dirname}${sep}..${sep}src${sep}scripts`;

// make launch scripts executable
export function setFilePermission() {
	switch (os_type) {
		case 'linux': exec(`chmod +x ${pathToScripts}${sep}launch_linux`); break;
		case 'darwin': exec(`chmod +x ${pathToScripts}${sep}launch_mac`); break;
	}
}

const config : vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration();

const win_shell_path : string = config.get<string>('terminal.integrated.shell.windows')!;

// powershell is default windows shell
let win_shell : String = "powershell.exe";

// on windows, os_type is set to win32 (even on 64 bit)
if (os_type === "win32") {
	// win_shell_path may be null if user never changed his shell
	if (null !== win_shell_path) {
		win_shell = getFile(win_shell_path, sep);
	}
}

export class REPLProvider implements vscode.Disposable {
	private terminal : vscode.Terminal;

	constructor() {
		this.terminal = this.initTerminal();
	}

	// create a new REPL terminal
	private initTerminal() : vscode.Terminal {
		return vscode.window.createTerminal("Racket");
	}

	private async createNewTerminalIfNeeded(terminal : vscode.Terminal = this.terminal) : Promise<vscode.Terminal> {
		const pid = await terminal.processId;

		if (!require('is-running')(pid)) {
			console.log("PID is killed!");
			this.terminal = await this.initTerminal(); // TODO: check
			terminal = await this.terminal;
		}
		else {
			console.log("PID is still working!");
		}

		return terminal;
	}

	// run the REPL with the current file
	public async run(filepath : String) : Promise<void> {
		// stop the old REPL terminal and start REPL in a new terminal
		this.stop(this.terminal);
		this.terminal = this.initTerminal();

		let dir : String = getDir(filepath, sep);
		const file : String = getFile(filepath, sep);

		// start the REPL
		this.launch(dir, file);

		// focus the terminal
		this.terminal.show(false);
	}

	// stop the REPL in the given terminal (by default it is a running terminal)
	public async stop(terminal : vscode.Terminal = this.terminal) : Promise<void> {
		// terminal.hide(); // TODO: I think I want it this way or hide it after deleting it (add sleep)
		const pid = await terminal.processId;

		// windows and linux/mac kill processes differently
		switch (os_type) {
			// on windows, os_type is set to win32 (even on 64 bit)
			case "win32": {
				if (pid !== undefined) {
					kill(pid);
				}

				return;
			}
			default: {
				// kill terminal process using SIGKILL
				exec(`kill -9 ${pid}`);
			}
		}
	}

	public runSelectionInREPL(terminal : vscode.Terminal = this.terminal) : void {
		const send = (s : string) => {
			const trimmed = s.trim();

			if (trimmed) {
				terminal.show(true);
				terminal.sendText(trimmed);
			}
		};

		let editor : vscode.TextEditor = vscode.window.activeTextEditor!;

		if (editor.selections.length === 1 && editor.selection.isEmpty) {
			send(editor.document.lineAt(editor.selection.active.line).text);

			return;
		}

		editor.selections.forEach((sel) => send(editor.document.getText(sel)));
	}

	// paste (enter! (file ./file.rkt)) into the terminal
	public async loadFileInREPL(terminal : vscode.Terminal = this.terminal) : Promise<void> {
		let editor : vscode.TextEditor = vscode.window.activeTextEditor!;

		const filePath : String = editor.document.fileName;

		terminal = await this.createNewTerminalIfNeeded(terminal);

		terminal.show();
		terminal.sendText(`(enter! (file "${filePath}"))`);
	}

	// TODO: add optional "clear" here
	// racket file.rkt
	public async runFileInTerminal(terminal : vscode.Terminal = this.terminal) : Promise<void> {
		let editor : vscode.TextEditor = vscode.window.activeTextEditor!;

		const filePath : String = editor.document.fileName;

		terminal = await this.createNewTerminalIfNeeded(terminal);

		terminal.show();

		// terminal.sendText(`clear`);

		// TODO: check if this is also possible on Windows
		terminal.sendText(`racket "${filePath}"`);
	}

	// stop REPL when object gets disposed
	dispose() {
		this.stop();
	}

	// launch the REPL script
	// each OS has a different script for their respective default shell
	private launch(dir : String, file : String) {
		let launcher : String;
		switch (os_type) {
			// on windows, os_type is set to win32 (even on 64 bit)
			case "win32":
				switch (win_shell) {
					case "powershell.exe": launcher = `${pathToScripts}${sep}launch_windows.bat`; break; // TODO: check
					case "cmd.exe": launcher = `${pathToScripts}${sep}launch_windows.bat`; break; // TODO: check
					default: {
						vscode.window.showErrorMessage(`Your shell: ${win_shell} is not yet supported.`);

						return;
					}
				} break;
			case "linux": launcher = `${pathToScripts}${sep}launch_linux`; break;
			case "darwin": launcher = `${pathToScripts}${sep}launch_mac`; break; // TODO: check
			default: {
				vscode.window.showErrorMessage(`Your operating system: ${os_type} is not yet supported.`);

				return;
			}
		}

		// scripts are stored in "src/scripts" folder
		this.terminal.sendText(`cd "${pathToScripts}"`); // TODO: check
		this.terminal.sendText(`"${launcher}" "${dir}" "${file}"`);
	}
}
