const http = require("http");
const pool = require("./db");

const PORT = process.env.PORT || 3000;
const APP_NAME = process.env.APP_NAME || "Backend";

const server = http.createServer(async (req, res) => {

    // GET all tasks
    if (req.method === "GET" && req.url === "/tasks") {
        try {
            const result = await pool.query(
                "SELECT * FROM tasks ORDER BY id"
            );

            res.writeHead(200, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify(result.rows));

        } catch (error) {
            console.error(error);

            res.writeHead(500);
            res.end(JSON.stringify({
                error: "Database error"
            }));
        }

        return;
    }

    // POST a new task
    if (req.method === "POST" && req.url === "/tasks") {

        let body = "";

        req.on("data", chunk => {
            body += chunk;
        });

        req.on("end", async () => {
            try {
                const { task } = JSON.parse(body);

                const result = await pool.query(
                    "INSERT INTO tasks (task) VALUES ($1) RETURNING *",
                    [task]
                );

                res.writeHead(201, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify(result.rows[0]));

            } catch (error) {
                console.error(error);

                res.writeHead(500);
                res.end(JSON.stringify({
                    error: "Could not create task"
                }));
            }
        });

        return;
    }

    // Database test
    if (req.url === "/db-test") {
        try {
            const result = await pool.query("SELECT NOW()");

            res.writeHead(200, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                message: "Database connection successful!",
                application: APP_NAME,
                database_time: result.rows[0].now
            }));

        } catch (error) {
            console.error(error);

            res.writeHead(500);
            res.end(JSON.stringify({
                message: "Database connection failed"
            }));
        }

        return;
    }

    // Default response
    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify({
        message: "Hello from backend!",
        service: APP_NAME
    }));
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`${APP_NAME} running on port ${PORT}`);
});