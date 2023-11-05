import {readFileSync} from 'fs';
import { ObsidianTask, TodoistTaskHandler } from './task';
import { TodoistApi } from "@doist/todoist-api-typescript";

console.log('Reading files');

const data = readFileSync('data.json', 'utf8');
const obj = JSON.parse(data);
console.log("Input data" + data);
let testObsidianLine = obj["test_obsidian_line"];
let apiKey = obj["todoist_api_key"];
console.log("Test obsidian line: " + apiKey);
const task = new ObsidianTask(testObsidianLine);
let api = new TodoistApi(apiKey)
const handler = new TodoistTaskHandler(api);
console.log("Task: " + task);
handler.syncObsidianTaskWithTodoist(task).then((task) => {console.log("Modified task: " + task.getObsidianString());});