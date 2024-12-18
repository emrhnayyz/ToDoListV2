import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "todo_list",
  password: "12345",
  port: 5432,
});
db.connect();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

// Home Route - Display Tasks
app.get("/", async (req, res) => {
  try {
    const tasksResult = await db.query("SELECT * FROM tasks ORDER BY task_id ASC");
    const categoriesResult = await db.query("SELECT DISTINCT category FROM tasks WHERE category IS NOT NULL");

    res.render("index.ejs", {
      tasks: tasksResult.rows,
      categories: categoriesResult.rows,
      selectedCategory: "all", // Varsayılan kategori
    });
  } catch (error) {
    console.error("Error fetching tasks or categories:", error);
    res.status(500).send("Server Error");
  }
});

// Add Task Route
app.post("/add", async (req, res) => {
  const { title, description, category, priority } = req.body;
  try {
    await db.query(
      "INSERT INTO tasks (title, description, category, priority) VALUES ($1, $2, $3, $4)",
      [title, description, category, priority || "normal"]
    );
    res.redirect("/");
  } catch (error) {
    console.log("Error adding task:", error);
    res.status(500).send("Server Error: Task could not be added.");
  }
});

// Delete Task Route
app.post("/delete/:id", async (req, res) => {
  const taskId = req.params.id;
  try {
    await db.query("DELETE FROM tasks WHERE task_id = $1", [taskId]);
    res.redirect("/");
  } catch (error) {
    console.log("Error deleting task:", error);
    res.status(500).send("Server Error: Task could not be deleted.");
  }
});

// Update Task Route
app.post("/update/:id", async (req, res) => {
  const taskId = req.params.id;
  const { title, description, category, priority } = req.body;

  try {
    await db.query(
      "UPDATE tasks SET title = $1, description = $2, category = $3, priority = $4 WHERE task_id = $5",
      [title, description, category, priority, taskId]
    );
    res.redirect("/");
  } catch (error) {
    console.log("Error updating task:", error);
    res.status(500).send("Server Error: Task could not be updated.");
  }
});
// Task completed or not ?
app.post("/toggle-complete/:id", async (req, res) => {
  const taskId = req.params.id;

  try {
    // Görevin mevcut durumunu alın
    const result = await db.query("SELECT completed FROM tasks WHERE task_id = $1", [taskId]);
    const currentStatus = result.rows[0].completed;

    // Durumu tersine çevir
    const newStatus = !currentStatus;
    await db.query("UPDATE tasks SET completed = $1 WHERE task_id = $2", [newStatus, taskId]);

    res.redirect("/");
  } catch (error) {
    console.error("Error toggling task completion:", error);
    res.status(500).send("Server Error");
  }
});

app.get("/filter/category", async (req, res) => {
  const selectedCategory = req.query.category;

  try {
    let tasksResult;
    if (selectedCategory === "all") {
      tasksResult = await db.query("SELECT * FROM tasks ORDER BY task_id ASC");
    } else {
      tasksResult = await db.query("SELECT * FROM tasks WHERE category = $1 ORDER BY task_id ASC", [selectedCategory]);
    }

    const categoriesResult = await db.query("SELECT DISTINCT category FROM tasks WHERE category IS NOT NULL");

    res.render("index.ejs", {
      tasks: tasksResult.rows,
      categories: categoriesResult.rows,
      selectedCategory, // Seçilen kategori
    });
  } catch (error) {
    console.error("Error filtering tasks by category:", error);
    res.status(500).send("Server Error");
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});