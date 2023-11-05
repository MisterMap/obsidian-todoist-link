import { Editor, App, EditorPosition, MarkdownView, Plugin, HeadingCache, PluginSettingTab, Setting, TFile } from 'obsidian';
import { TodoistApi } from '@doist/todoist-api-typescript'
import { ObsidianTask, TodoistTaskHandler } from './task';

interface TodoistLinkSettings {
	apikey: string;
}

const DEFAULT_SETTINGS: TodoistLinkSettings = {
	apikey: '', 
}

// https://github.com/mgmeyers/obsidian-copy-block-link/blob/9f9ce83ecabeda03528fe3efddbd2d766d280821/main.ts#L120
// https://github.com/blacksmithgu/obsidian-dataview/blob/60455e5aaf98bfea3848431c7cc3efbb5e2f4427/src/data/parse/markdown.ts#L118
export function findPreviousHeader(line: number, headers: HeadingCache[]): string | undefined {
    if (headers.length == 0) return undefined;
    if (headers[0].position.start.line > line) return undefined;

    let index = headers.length - 1;
    while (index >= 0 && headers[index].position.start.line > line) index--;

    return headers[index].heading;
}

export default class TodoistLinkPlugin extends Plugin {

	settings: TodoistLinkSettings;

	getTodistApi(): TodoistApi {
		const api = new TodoistApi(this.settings.apikey);
		return api
	}

	getTodoistTaskHandler(): TodoistTaskHandler {
		const api = this.getTodistApi();
		const handler = new TodoistTaskHandler(api);
		return handler
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async onload() {
		await this.loadSettings();
		this.addCommand({
			id: 'update-todoist-task',
			name: 'Update Todoist Task',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.updateObsidianTaskForCurrentLine(view)
			}
		});
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new TodoistLinkSettingTab(this.app, this));
	}

	onunload() {
	}

	updateObsidianTaskForCurrentLine(view: MarkdownView) {
		const lineNumber = view.editor.getCursor().line
		this.updateObsidianTask(lineNumber, view)
	}

	updateObsidianTask(lineNumber: number, view: MarkdownView) {
		const fileName = view.file.name
		const obsidianLineText = view.editor.getLine(lineNumber)
		const trimedObsidianLineText = obsidianLineText.trim()
		const trimedFileName = fileName.replace(/\.md$/, "")
		let obsidianTask = new ObsidianTask(trimedObsidianLineText, null, null, trimedFileName)
		let todoistTaskHandler = this.getTodoistTaskHandler()
		todoistTaskHandler.syncObsidianTaskWithTodoist(obsidianTask).then(
			(task) => {this.updateObsidianLine(lineNumber, task.getObsidianString(), view);}
		).catch((error) => console.log(error));
	}

	updateObsidianLine(lineNumber: number, newText: string, view: MarkdownView) {
		const obsidianLineText = view.editor.getLine(lineNumber)
		const firstLetterIndex = obsidianLineText.search(/[a-zA-Z\\[]|[0-9]/);
		const lastLetterIndex = obsidianLineText.length;
		const startRange: EditorPosition = {
			line: lineNumber,
			ch: firstLetterIndex
		}
		const endRange: EditorPosition = {
			line: lineNumber,
			ch: lastLetterIndex
		}
		console.log("New text is: " + newText)
		console.log("First letter index is: " + firstLetterIndex)
		console.log("Last letter index is: " + lastLetterIndex)
		console.log("Old text is: " + obsidianLineText)
		console.log("Line number is: " + lineNumber)
		view.editor.replaceRange(newText, startRange, endRange);
	}
	
}


class TodoistLinkSettingTab extends PluginSettingTab {
	plugin: TodoistLinkPlugin;

	constructor(app: App, plugin: TodoistLinkPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		
		this.containerEl.createEl('h2', { text: 'Authentication' })


		new Setting(containerEl)
			.setName('API Key')
			.setDesc('Get your api key and enter it here. From https://todoist.com/app/settings/integrations')
			.addText(text => text
				.setPlaceholder('Enter your API Key')
				.setValue(this.plugin.settings.apikey)
				.onChange(async (value) => {
					this.plugin.settings.apikey= value;
					await this.plugin.saveSettings();
				}));

		this.containerEl.createEl('h2', { text: 'General' })
	}
}