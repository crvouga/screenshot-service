import dotenv from "dotenv";

dotenv.config();

const URL_WHITELIST_CSV = process.env.URL_WHITELIST_CSV;

if (!URL_WHITELIST_CSV) {
  throw new Error("process.env.URL_WHITELIST_CSV is undefined");
}

export default {
  URL_WHITELIST_CSV,
};
