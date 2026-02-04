import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import User from "./models/User.js";

const app = express();

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// view engine
app.set("view engine", "ejs");

// mongo connect
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Atlas connected"))
    .catch((err) => console.error(err));

// routes
app.get("/", (req, res) => {
    res.render("index");
});
app.post("/", async (req, res) => {
    const { name } = req.body;

    const user = await User.create({
        name: name
    });

    res.redirect("/"); // IMPORTANT
});

app.get("/test-db", async (req, res) => {
    // const user = await User.create({
    //     name: "Test User",
    //     email: "test@example.com",
    //     phone: "9999999999"
    // });
    // res.send(user);
    const users = await User.find();
    res.send(users);
});

app.post("/signup",async(req, res) => {

})

// server
app.listen(3000, () => {
    console.log("Server running on port 3000");
});
