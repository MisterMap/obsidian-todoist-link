import { Task, TodoistApi } from "@doist/todoist-api-typescript";

// ObsidianTaskFactory
export class ObsidianTaskFactory {
    static createObsidianTask(summaryOrObsidianString: string, projectName?: string): ObsidianTask {
        let regex = /\- \[(x| )\] (.*)(?: \(\[Todoist\]\((?:.*id=(\d*)\)\)))/;
        let match = regex.exec(summaryOrObsidianString);
        console.log("match: " + match);
        if (match) {
            return new ObsidianTask(match[2], match[1] == 'x', match[3], projectName);
        }

        let shortRegex = /\- \[(x| )\] (.*)/;
        let shortMatch = shortRegex.exec(summaryOrObsidianString);
        console.log("shortMatch: " + shortMatch);
        if (shortMatch) {
            return new ObsidianTask(shortMatch[2], shortMatch[1] == 'x', null, projectName);
        }

        let urlRegex = /https:\/\/app\.todoist\.com\/app\/task\/\D*(\d+)/;
        let urlMatch = urlRegex.exec(summaryOrObsidianString);
        console.log("urlMatch: " + urlMatch);
        if (urlMatch) {
            return new ObsidianTask(summaryOrObsidianString, false, urlMatch[1], projectName);
        }

        return new ObsidianTask(summaryOrObsidianString, false, null, projectName);
    }
}




export class ObsidianTask {
    summary: string;
    completed: boolean;
    id?: string;
    projectName?: string;
    description?: string;

    constructor(summary: string, completed: boolean, id?: string, projectName?: string, description?: string) {
        this.summary = summary;
        this.completed = completed;
        this.id = id;
        this.projectName = projectName;
        this.description = description;
    }


    getTodoistUrl(): string {
        return `https://todoist.com/showTask?id=${this.id}`;
    }

    getTodoistString(): string {
        if (!this.id) {
            return '';
        }
        return ` ([Todoist](${this.getTodoistUrl()}))`
    }

    getMarkdownCheckbox(): string {
        return `- [${this.completed ? 'x' : ' '}]`;
    }

    getObsidianString(): string {
        let result: string = `${this.getMarkdownCheckbox()} ${this.summary}${this.getTodoistString()}`;
        return result;
    }

    getTodoistDescription(): string {
        if (this.projectName == null) {
            return ``
        }
        if (this.description == null || this.description == "") {
            return `**${this.projectName}**`
        }
        return `**${this.projectName}**\n${this.description}`
    }
}


export class TodoistTaskHandler {
    api: TodoistApi;

    constructor(api: TodoistApi) {
        this.api = api;
    }

    async syncObsidianTaskWithTodoist(task: ObsidianTask): Promise<ObsidianTask> {
        if (task.id == null) {
            console.log('Creating new task');
            await this.createTodoistTask(task);
        }
        console.log('Updating task');
        let todoistTask = await this.getTodoistTask(task);
        if (todoistTask == null) {
            console.log('Task not found, creating new one');
            await this.createTodoistTask(task);
            todoistTask = await this.getTodoistTask(task);
        }
        console.log('Task found, updating');
        console.log('Todoist task: ' + JSON.stringify(todoistTask));
        await this.updateObsidianTask(task, todoistTask as Task);
        await this.updateTodoistTaskDescription(task);
        return task;
    }

    async updateObsidianTask(task: ObsidianTask, todoistTask: Task): Promise<ObsidianTask> {
        task.summary = todoistTask.content;
        task.completed = todoistTask.isCompleted;
        task.id = todoistTask.id;
        task.description = this.parseTodoistTaskDescription(todoistTask.description);
        return task;
    }

    getTodoistTask(task: ObsidianTask): Promise<void|Task> {
        return this.api.getTask(task.id).catch((error) => console.log(error))
    }

    async createTodoistTask(task: ObsidianTask): Promise<void> {
        await this.api.addTask({
            content: task.summary,
            description: task.getTodoistDescription(),
        }).then((todoistTask) => {task.id = todoistTask.id}).catch((error) => console.log(error));
    }

    async updateTodoistTaskDescription(task: ObsidianTask): Promise<void> {
        await this.api.updateTask(task.id, {
            description: task.getTodoistDescription(),
        }).catch((error) => console.log(error));
    }

    parseTodoistTaskDescription(description: string): string {
        let regex = /(?:\*\*(.*)\*\*)?\n?(.*)/;
        let match = regex.exec(description);
        if (match) {
            return match[2];
        }
        return description;
    }

}