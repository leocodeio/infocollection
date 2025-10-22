import { Router } from "express";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..", "..", "..");

const router: Router = Router();

router.get("/", (req, res) => {
  return res.sendFile(resolve(__dirname, "public", "index.html"));
});

export default router;
