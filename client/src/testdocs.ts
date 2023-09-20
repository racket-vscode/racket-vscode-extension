import { MarkdownString } from 'vscode';
import {readFileSync} from 'fs';
import {resolve} from 'path';

function lookupDocs(name : string) : MarkdownString {
	console.log(resolve(__dirname, `./docs/${name}.md`));
	const test = readFileSync(resolve(__dirname, `./docs/${name}.md`), 'utf-8');
	const test2 = readFileSync(resolve(__dirname, `./docs/${name}.md`), 'utf-8');

	const test3 = test2;
	return <unknown>readFileSync(resolve(__dirname, `./docs/${name}.md`), 'utf-8') as MarkdownString;
}

lookupDocs('define')