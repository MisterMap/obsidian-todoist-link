import { Task, TodoistApi } from "@doist/todoist-api-typescript";

export class ObsidianTask {
    summary: string;
    completed: boolean;
    id?: string;
    projectName?: string;

    constructor(summaryOrObsidianString: string, completed?: boolean, id?: string, projectName?: string) {
        this.projectName = projectName ?? null;
        if (completed != null) {
            this.summary = summaryOrObsidianString;
            this.completed = completed;
            this.id = id ?? null;
            return;
        }
        let regex = /\- \[(x| )\] (.*)(?: \(\[Todoist\]\((?:.*id=(\d*)\)\)))/;
        let match = regex.exec(summaryOrObsidianString);
        console.log("match: " + match);
        if (match) {
            this.summary = match[2];
            this.completed = match[1] == 'x';
            this.id = match[3];
            return;
        }
        let shortRegex = /\- \[(x| )\] (.*)/;
        let shortMatch = shortRegex.exec(summaryOrObsidianString);
        console.log("shortMatch: " + shortMatch);
        if (shortMatch) {
            this.summary = shortMatch[2];
            this.completed = shortMatch[1] == 'x';
            this.id = null;
            return;
        }
        this.summary = summaryOrObsidianString;
        this.completed = false;
        this.id = null;
    }


    getTodoistUrl(): string {
        return `https://todoist.com/showTask?id=${this.id}`;
    }

    getTodoistDescription(): string {
        if (!this.id) {
            return '';
        }
        return ` ([Todoist](${this.getTodoistUrl()}))`
    }

    getMarkdownCheckbox(): string {
        return `- [${this.completed ? 'x' : ' '}]`;
    }

    getObsidianString(): string {
        let result: string = `${this.getMarkdownCheckbox()} ${this.summary}${this.getTodoistDescription()}`;
        return result;
    }

    getDescription(): string {
        if (this.projectName == null) {
            return ``
        }
        return `**${this.projectName}**`;
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
            return task;
        }
        console.log('Updating task');
        let todoistTask = await this.getTodoistTask(task);
        if (todoistTask == null) {
            console.log('Task not found, creating new one');
            await this.createTodoistTask(task);
            return task;
        }
        console.log('Task found, updating');
        console.log('Todoist task: ' + JSON.stringify(todoistTask));
        return this.updateObsidianTask(task, todoistTask as Task);
    }

    updateObsidianTask(task: ObsidianTask, todoistTask: Task): ObsidianTask {
        task.summary = todoistTask.content;
        task.completed = todoistTask.isCompleted;
        task.id = todoistTask.id;
        return task;
    }

    getTodoistTask(task: ObsidianTask): Promise<void|Task> {
        return this.api.getTask(task.id).catch((error) => console.log(error))
    }

    async createTodoistTask(task: ObsidianTask): Promise<void> {
        await this.api.addTask({
            content: task.summary,
            description: task.getDescription(),
        }).then((todoistTask) => {task.id = todoistTask.id}).catch((error) => console.log(error));
    }

}