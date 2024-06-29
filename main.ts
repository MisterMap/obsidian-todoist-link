import { Editor, App, EditorPosition, MarkdownView, Plugin, HeadingCache, PluginSettingTab, Setting, TFile } from 'obsidian';
import { TodoistApi } from '@doist/todoist-api-typescript'
import { ObsidianTask, ObsidianTaskFactory, TodoistTaskHandler } from './task';

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
		this.addCommand({
			id: 'update-todoist-task-for-file',
			name: 'Update Todoist Task For File',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.updateObsidianTasksForFile(view)
			}
		})
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new TodoistLinkSettingTab(this.app, this));
	}

	updateObsidianTasksForFile(view: MarkdownView) {
		const lineCount = view.editor.lineCount()
		for (let line = 0; line < lineCount; line++) {
			if (this.isLineATask(line, view)) {
				this.updateObsidianTask(line, view)
			}
		}
	}

	isLineATask(line: number, view: MarkdownView): boolean {
		const lineText = view.editor.getLine(line)
		const trimmedLineText = lineText.trim()
		if (trimmedLineText.startsWith("- [ ]") || trimmedLineText.startsWith("- [x]")) {
			return true
		}
		let urlRegex = /https:\/\/app\.todoist\.com\/app\/task\/\D*(\d+)/;
        let urlMatch = urlRegex.exec(trimmedLineText);
		if (urlMatch) {
			return true
		}
		return false
	}

	onunload() {
	}

	updateObsidianTaskForCurrentLine(view: MarkdownView) {
		const lineNumber = view.editor.getCursor().line
		this.updateObsidianTask(lineNumber, view).then(() => {
			view.editor.setCursor(lineNumber, view.editor.getLine(lineNumber).length);
		})
	}

	async updateObsidianTask(lineNumber: number, view: MarkdownView) {
		const fileName = view.file.name
		const obsidianLineText = view.editor.getLine(lineNumber)
		const trimedObsidianLineText = obsidianLineText.trim()
		const trimedFileName = fileName.replace(/\.md$/, "")
		let obsidianTask = ObsidianTaskFactory.createObsidianTask(trimedObsidianLineText, trimedFileName)
		let todoistTaskHandler = this.getTodoistTaskHandler()
		await todoistTaskHandler.syncObsidianTaskWithTodoist(obsidianTask).then(
			(task) => {this.updateObsidianLineText(lineNumber, task.getObsidianString(), view);}
		).catch((error) => console.log(error));
	}

	updateObsidianLineText(lineNumber: number, newText: string, view: MarkdownView) {
		const obsidianLineText = view.editor.getLine(lineNumber)
		const firstLetterIndex = 0;
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