import app from "./app.js";

const PORT = process.env.PORT || 3000;

const start = async() => {
    app.listen(PORT, () => {
        console.log(`Server is listening at ${PORT}`);
    })
}

start();