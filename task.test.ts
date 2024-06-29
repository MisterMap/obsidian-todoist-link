import { ObsidianTask, ObsidianTaskFactory } from './task';

test('test task constructor', () => {
    expect(new ObsidianTask("Do this.  [[Task]]", false, null, null, null)).toMatchObject({
        summary: "Do this.  [[Task]]",
        completed: false,
        id: null,
        projectName: null,
        description: null,
    });
})


test('test task constructor completed = false', () => {
    expect(ObsidianTaskFactory.createObsidianTask("- [ ] Do this.  [[Task]]")).toMatchObject({
        summary: "Do this.  [[Task]]",
        completed: false,
        id: null,
    });
})

test('test task constructor completed = true', () => {
    expect(ObsidianTaskFactory.createObsidianTask("- [x] Do this.  [[Task]]")).toMatchObject({
        summary: "Do this.  [[Task]]",
        completed: true,
        id: null,
    });
})

test('test task constructor completed = id', () => {
    expect(ObsidianTaskFactory.createObsidianTask("- [x] Implement the EGGS algorithm using the modified heuristic function ([Todoist](https://todoist.com/showTask?id=6802270236))")).toMatchObject({
        summary: "Implement the EGGS algorithm using the modified heuristic function",
        completed: true,
        id: "6802270236",
    });
})


test('test task constructor completed different parameters', () => {
    expect(new ObsidianTask("Do task", false, "6900", "project")).toMatchObject({
        summary: "Do task",
        completed: false,
        id: "6900",
        projectName: "project",
    });
})

test('test task constructor completed different parameters with project', () => {
    expect(new ObsidianTask("Do task", false, "6900")).toMatchObject({
        summary: "Do task",
        completed: false,
        id: "6900",
    });
})

test('test task constructor completed different parameters null id', () => {
    expect(new ObsidianTask("Do task", false)).toMatchObject({
        summary: "Do task",
        completed: false,
    });
})

test('test task constructor from todoist link', () => {
    expect(ObsidianTaskFactory.createObsidianTask("some text https://app.todoist.com/app/task/sdelat-follow-up-po-vstreche-po-vmeshatelstvam-7522900525")).toMatchObject({
        summary: "some text https://app.todoist.com/app/task/sdelat-follow-up-po-vstreche-po-vmeshatelstvam-7522900525",
        completed: false,
        id: "7522900525",
    });
})

test('test task constructor from only todoist link', () => {
    expect(ObsidianTaskFactory.createObsidianTask("https://app.todoist.com/app/task/sdelat-follow-up-po-vstreche-po-vmeshatelstvam-7522900525")).toMatchObject({
        summary: "https://app.todoist.com/app/task/sdelat-follow-up-po-vstreche-po-vmeshatelstvam-7522900525",
        completed: false,
        id: "7522900525",
    });
})

test('test get obsidian string', () => {
    expect((new ObsidianTask("- [x] Do this.  [[Task]]", false)).getObsidianString()).toMatch("- [x] Do this.  [[Task]]");
})

test('test get obsidian string', () => {
    expect((ObsidianTaskFactory.createObsidianTask("- [x] Implement the EGGS algorithm using the modified heuristic function ([Todoist](https://todoist.com/showTask?id=6802270236))")).getObsidianString()).toMatch(
        "- [x] Implement the EGGS algorithm using the modified heuristic function ([Todoist](https://todoist.com/showTask?id=6802270236))");
})

