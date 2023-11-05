import { ObsidianTask } from './task';

test('test task constructor', () => {
    expect(new ObsidianTask("Do this.  [[Task]]")).toMatchObject({
        summary: "Do this.  [[Task]]",
        completed: false,
        id: null
    });

})


test('test task constructor completed = false', () => {
    expect(new ObsidianTask("- [ ] Do this.  [[Task]]")).toMatchObject({
        summary: "Do this.  [[Task]]",
        completed: false,
        id: null,
    });
})

test('test task constructor completed = true', () => {
    expect(new ObsidianTask("- [x] Do this.  [[Task]]")).toMatchObject({
        summary: "Do this.  [[Task]]",
        completed: true,
        id: null,
    });
})

test('test task constructor completed = id', () => {
    expect(new ObsidianTask("- [x] Implement the EGGS algorithm using the modified heuristic function ([Todoist](https://todoist.com/showTask?id=6802270236))")).toMatchObject({
        summary: "Implement the EGGS algorithm using the modified heuristic function",
        completed: true,
        id: "6802270236",
        projectName: null,
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
        id: null,
    });
})


test('test get obsidian string', () => {
    expect((new ObsidianTask("- [x] Do this.  [[Task]]")).getObsidianString()).toMatch("- [x] Do this.  [[Task]]");
})

test('test get obsidian string', () => {
    expect((new ObsidianTask("- [x] Implement the EGGS algorithm using the modified heuristic function ([Todoist](https://todoist.com/showTask?id=6802270236))")).getObsidianString()).toMatch(
        "- [x] Implement the EGGS algorithm using the modified heuristic function ([Todoist](https://todoist.com/showTask?id=6802270236))");
})