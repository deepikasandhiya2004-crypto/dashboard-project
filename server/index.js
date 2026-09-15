import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { signToken, requireAuth } from "./auth.js";

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// ---- Auth ----

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
    return res.status(400).json({
      error: "Name, email, and a password of at least 6 characters are required.",
    });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, password: hashed } });

  const token = signToken(user);
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid email or password." });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid email or password." });

  const token = signToken(user);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ id: user.id, name: user.name, email: user.email });
});

// ---- Projects (all routes below require login) ----

app.use("/api/projects", requireAuth);
app.use("/api/tasks", requireAuth);

app.get("/api/projects", async (req, res) => {
  const projects = await prisma.project.findMany({ orderBy: { createdAt: "desc" } });
  res.json(projects);
});

app.post("/api/projects", async (req, res) => {
  const { name, client, status, progress } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Project name is required." });
  }
  const project = await prisma.project.create({
    data: { name, client, status: status || "planning", progress: progress ?? 0 },
  });
  res.status(201).json(project);
});

app.patch("/api/projects/:id", async (req, res) => {
  try {
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(project);
  } catch {
    res.status(404).json({ error: "Project not found." });
  }
});

app.delete("/api/projects/:id", async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: "Project not found." });
  }
});

// ---- Tasks ----

app.get("/api/tasks", async (req, res) => {
  const tasks = await prisma.task.findMany({ orderBy: { createdAt: "desc" } });
  res.json(tasks);
});

app.post("/api/tasks", async (req, res) => {
  const { title, assignee, priority, status, dueDate } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Task title is required." });
  }
  const task = await prisma.task.create({
    data: {
      title,
      assignee,
      priority: priority || "medium",
      status: status || "todo",
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });
  res.status(201).json(task);
});

app.patch("/api/tasks/:id", async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.dueDate) data.dueDate = new Date(data.dueDate);
    const task = await prisma.task.update({ where: { id: req.params.id }, data });
    res.json(task);
  } catch {
    res.status(404).json({ error: "Task not found." });
  }
});

app.delete("/api/tasks/:id", async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: "Task not found." });
  }
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));
