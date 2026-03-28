import app from "./app.js";
import "./db/db.js";
import { startScheduler } from "./jobs/scheduler.js";

const PORT = process.env.PORT || 3000;

const start = async() => {
    app.listen(PORT, () => {
        console.log(`Server is listening at ${PORT}`);
    })

    // Start background OSM Ingestion - runs immediately then every 24 hours
    // No API route, no frontend trigger - fully automatic.
    startScheduler();
}

start();