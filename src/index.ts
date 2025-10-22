import express from "express";
import dotenv from "dotenv";
import validateEnv from "./utils/env-check/env-check.service.js";
import clientRoutes from "./client/routes.js";

dotenv.config();

validateEnv();

const app = express();
const port = process.env.PORT;

app.get("/", (req, res) => {
  res.send("Hello people, this is the home page");
});

app.use(express.static("public"));
app.use("/app", clientRoutes);

app.listen(port, () => {
  if (process.env.NODE_ENV === "development") {
    console.log(`server running at http://localhost:${port}`);
  } else {
    console.log(`server running at ${process.env.BASE_URL}`);
  }
});
