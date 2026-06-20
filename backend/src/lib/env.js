import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url)); // give the path directry of the current file 

dotenv.config({
  path: path.resolve(__dirname, "..","..", ".env"),
});