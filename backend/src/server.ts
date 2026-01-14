import app from "./app.js";
import "./db/db.js";

const PORT = process.env.PORT || 3000;

const start = async() => {
    app.listen(PORT, () => {
        console.log(`Server is listening at ${PORT}`);
    })
}

start();