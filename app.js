let config;
let editingTaskId = null;

async function loadConfig() {
    const response = await fetch("config.json");
    config = await response.json();
}

function getHeaders() {
    return {
        "apikey": config.supabasePublishableKey,
        "Authorization": `Bearer ${config.supabasePublishableKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    };
}

async function loadTasks() {
    try {
        const response = await fetch(
            `${config.supabaseUrl}/rest/v1/tasks?select=*`,
            {
                headers: getHeaders()
            }
        );

        const tasks = await response.json();

        const taskList = document.getElementById("task-list");
        taskList.innerHTML = "";

        tasks.forEach(task => {
            const item = document.createElement("div");

            item.className = "task-item";
            item.setAttribute("data-id", task.id);

            item.innerHTML = `
                <h3 class="task-title">${task.title}</h3>
                <p class="task-description">${task.description || ""}</p>
                <p class="task-status">
                    ${task.completed ? "Completed" : "Incomplete"}
                </p>

                <button class="edit-task">Edit</button>
                <button class="toggle-task">
                    ${task.completed ? "Mark Incomplete" : "Mark Complete"}
                </button>
                <button class="delete-task">Delete</button>
            `;

            item.querySelector(".edit-task")
                .addEventListener("click", () => editTask(task));

            item.querySelector(".toggle-task")
                .addEventListener("click", () => toggleTask(task));

            item.querySelector(".delete-task")
                .addEventListener("click", () => deleteTask(task.id));

            taskList.appendChild(item);
        });
    } catch (error) {
        document.getElementById("status-message").textContent =
            "Failed to load tasks.";
    }
}

async function createTask(title, description) {
    await fetch(
        `${config.supabaseUrl}/rest/v1/tasks`,
        {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify([
                {
                    title,
                    description,
                    completed: false
                }
            ])
        }
    );
}

async function updateTask(id, title, description, completed) {
    await fetch(
        `${config.supabaseUrl}/rest/v1/tasks?id=eq.${id}`,
        {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify({
                title,
                description,
                completed
            })
        }
    );
}

async function deleteTask(id) {
    await fetch(
        `${config.supabaseUrl}/rest/v1/tasks?id=eq.${id}`,
        {
            method: "DELETE",
            headers: getHeaders()
        }
    );

    loadTasks();
}

function editTask(task) {
    document.getElementById("task-title").value = task.title;
    document.getElementById("task-description").value =
        task.description || "";

    editingTaskId = task.id;
}

async function toggleTask(task) {
    await updateTask(
        task.id,
        task.title,
        task.description,
        !task.completed
    );

    loadTasks();
}

document
    .getElementById("task-form")
    .addEventListener("submit", async e => {
        e.preventDefault();

        const title =
            document.getElementById("task-title").value;

        const description =
            document.getElementById("task-description").value;

        if (editingTaskId) {
            await updateTask(
                editingTaskId,
                title,
                description,
                false
            );

            editingTaskId = null;
        } else {
            await createTask(title, description);
        }

        e.target.reset();

        loadTasks();
    });

(async () => {
    await loadConfig();
    await loadTasks();
})();
