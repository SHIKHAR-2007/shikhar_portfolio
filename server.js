import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import emailjs from "@emailjs/nodejs";
import User from "./models/User.js";
import session from "express-session";

const app = express();

/* ===================== MIDDLEWARE ===================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 // 1 day
        }
    })
);
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect("/sign_in");
    }
    next();
};

app.set("view engine", "ejs");

/* ===================== DATABASE ===================== */
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch(err => console.error("❌ MongoDB error:", err));

/* ===================== ROUTES ===================== */

/* ---------- SIGN UP ---------- */
app.get("/", (req, res) => {
    res.render("index");
});

app.post("/", async (req, res) => {
    try {
        const { name, email, dob, phone, pin } = req.body;

        await User.create({
            name,
            email,
            dob,
            phone,
            pin
        });

        res.redirect("/sign_in");
    } catch (err) {
        console.error("SIGNUP ERROR:", err);
        res.send("Signup failed");
    }
});

/* ---------- SIGN IN ---------- */
app.get("/sign_in", (req, res) => {
    res.render("sign_in", {
        error: null
    });
});

app.post("/sign_in", async (req, res) => {
    try {
        const { email, pin } = req.body;

        const user = await User.findOne({ email });

        if (!user || String(user.pin) !== String(pin)) {
            return res.render("sign_in", {
                error: "Invalid email or PIN"
            });
        }

        // res.send("Login successful"); // later → dashboard
        // ✅ Save user ID in session
        req.session.userId = user._id;

        res.redirect("/dashboard");
    } catch (err) {
        console.error("LOGIN ERROR:", err);
        res.render("sign_in", {
            error: "Something went wrong"
        });
    }
});
/* ---------- Dashboard ---------- */
app.get("/dashboard", requireAuth, async (req, res) => {
    const user = await User.findById(req.session.userId).lean();

    if (!user) {
        req.session.destroy();
        return res.redirect("/sign_in");
    }

    delete user.pin;

    res.render("dashboard", {
        user
    });
});
/* ---------- LOG OUT ---------- */
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/sign_in");
    });
});

/* ---------- RECOVER PIN ---------- */
app.get("/recover_pin", (req, res) => {
    res.render("recover_pin", {
        error: null,
        success: null
    });
});

app.post("/recover-pin", async (req, res) => {
    try {
        const { email } = req.body;
        console.log("🔁 Recover PIN request:", email);

        const user = await User.findOne({ email });

        if (!user) {
            return res.render("recover_pin", {
                error: "No account found with this email",
                success: null
            });
        }

        const templateParams = {
            email: user.email,
            pin: String(user.pin),
            name: "UniVerse Team"
        };

        console.log("📨 Sending email with:", templateParams);

        await emailjs.send(
            process.env.EMAILJS_SERVICE_ID,
            process.env.EMAILJS_TEMPLATE_ID,
            {
                email: user.email,
                pin: String(user.pin),
                name: "UniVerse Team"
            },
            {
                publicKey: process.env.EMAILJS_PUBLIC_KEY,
                privateKey: process.env.EMAILJS_PRIVATE_KEY
            }
        );

        console.log("✅ Email sent successfully");

        res.render("recover_pin", {
            success: "Your PIN has been sent to your email",
            error: null
        });

    } catch (err) {
        console.error("❌ RECOVER PIN ERROR:", err);
        res.render("recover_pin", {
            error: "Failed to send email. Please try again later.",
            success: null
        });
    }
});

/* ---------- TERMS ---------- */
app.get("/terms", (req, res) => {
    res.render("terms_and_conditions");
});

/* ---------- DEBUG ---------- */
app.get("/test-db", async (req, res) => {
    const users = await User.find();
    res.json(users);
});

/* ===================== SERVER ===================== */
app.listen(3000, () => {
    console.log("🚀 Server running on http://localhost:3000");
});
