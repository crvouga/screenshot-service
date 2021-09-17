import dotenv from "dotenv";

dotenv.config();

export default {
  URL_WHITELIST_CSV: process.env.URL_WHITELIST_CSV,
};
