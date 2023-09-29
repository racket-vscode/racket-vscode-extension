import { HoverProvider, TextDocument, Position, CancellationToken, ProviderResult, Hover} from 'vscode';

export const hoverProvider : HoverProvider = {
	provideHover(document : TextDocument, position : Position, token : CancellationToken) : ProviderResult<Hover> {
		const range = document.getWordRangeAtPosition(position);
		const word = document.getText(range);

		if (word == "define"){
			return new Promise(resolve => {
				resolve(new Hover('Hello World'));
			});
		}

	}
}