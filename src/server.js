import "dotenv/config";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";

const port = Number(process.env.PORT || 4001);

await connectDatabase();

createApp().listen(port, () => {
  console.log(`Dala Smart API http://localhost:${port}`);
});
