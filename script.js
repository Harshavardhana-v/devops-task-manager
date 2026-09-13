async function loadTasks() {

    const response = await fetch("/api/tasks");

    const tasks = await response.json();

    const taskList = document.getElementById("taskList");

    taskList.innerHTML = "";

    tasks.forEach(task => {

        let li = document.createElement("li");

        li.innerHTML = `
            <span>${task.task}</span>
            <button onclick="this.parentElement.remove()">Delete</button>
        `;

        taskList.appendChild(li);
    });
}


async function addTask() {

    let input = document.getElementById("taskInput");

    let task = input.value.trim();

    if (task === "") {
        alert("Please enter a task");
        return;
    }

    await fetch("/api/tasks", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            task: task
        })
    });

    input.value = "";

    // Reload tasks from PostgreSQL
    loadTasks();
}


async function testBackend() {

    const response = await fetch("/api");

    const data = await response.json();

    console.log(data);
}


// Load saved tasks when page opens
loadTasks();