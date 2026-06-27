import "dotenv/config";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { ensureBucket } from "./utils/s3.js";

const port = Number(process.env.PORT || 4001);

await connectDatabase();
await ensureBucket();

createApp().listen(port, () => {
  console.log(`Dala Smart API http://localhost:${port}`);
});
