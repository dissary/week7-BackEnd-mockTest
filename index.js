let express = require("express");
let path = require("path");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();
const { DATABASE_URL } = process.env;

let app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
});

async function getPostgresVersion() {
  const client = await pool.connect();
  try {
    const response = await client.query("SELECT version()");
    console.log(response.rows[0]);
  } finally {
    client.release();
  }
}

getPostgresVersion();

app.get("/books", async (req, res) => {
  const client = await pool.connect();
  try {
    const query = "SELECT * FROM books";
    const result = await client.query(query);
    res.json(result.rows);
  } catch (err) {
    console.log(err.stack);
    res.status(500).send("An Error Occured");
  } finally {
    client.release()
  }
})

app.post("/books", async (req, res) => {
  const client = await pool.connect();

  try {
    const data = {
      title: req.body.title,
      author: req.body.author,
      year_published: req.body.year_published
    };

    const query = "INSERT INTO books (title, author, year_published) VALUES ($1, $2, $3) RETURNING id";
    const params = [data.title, data.author, data.year_published];

    const result = await client.query(query, params);
    data.id = result.rows[0].id;

    console.log(`Book created successfully with id ${data.id}`);
    res.json({"status": "success", "data": data, "message": "Book created successfully"});

  } catch (error) {
    console.error("Error: ", error.message);
    res.status(500).json({ "error": error.message});
  } finally {
    client.release();
  }
})

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(3000, "0.0.0.0", () => {
  console.log("App is listening on port 3000");
});
