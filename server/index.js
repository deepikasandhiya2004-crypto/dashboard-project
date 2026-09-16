import "dotenv/config";
import crypto from "crypto";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { signToken, requireAuth, requireRole } from "./auth.js";
import { sendPasswordResetEmail } from "./mailer.js";

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
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
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
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

// ---- Password reset ----

app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required." });

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry },
      });

      const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
      await sendPasswordResetEmail(user.email, resetLink);
    }

    res.json({ message: "If an account exists for that email, a reset link has been sent." });
  } catch (err) {
    console.error("forgot-password error:", err.message);
    res.status(500).json({ error: "Couldn't send the reset email. Check server logs." });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password || password.length < 6) {
    return res.status(400).json({ error: "A valid token and a password of at least 6 characters are required." });
  }

  const user = await prisma.user.findUnique({ where: { resetToken: token } });
  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    return res.status(400).json({ error: "This reset link is invalid or has expired." });
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, resetToken: null, resetTokenExpiry: null },
  });

  res.json({ message: "Password updated. You can now log in." });
});

// ---- Projects (all routes below require login) ----

app.use("/api/projects", requireAuth);
app.use("/api/tasks", requireAuth);
app.use("/api/leads", requireAuth);
app.use("/api/clients", requireAuth);
app.use("/api/deals", requireAuth);
app.use("/api/proposals", requireAuth);
app.use("/api/activities", requireAuth);

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

app.delete("/api/projects/:id", requireRole("admin"), async (req, res) => {
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

// ---- Leads ----

app.get("/api/leads", async (req, res) => {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
  res.json(leads);
});

app.post("/api/leads", async (req, res) => {
  const { name, email, phone, source, status, value } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Lead name is required." });
  }
  const lead = await prisma.lead.create({
    data: { name, email, phone, source, status: status || "new", value: value ?? 0 },
  });
  res.status(201).json(lead);
});

app.patch("/api/leads/:id", async (req, res) => {
  try {
    const lead = await prisma.lead.update({ where: { id: req.params.id }, data: req.body });
    res.json(lead);
  } catch {
    res.status(404).json({ error: "Lead not found." });
  }
});

app.delete("/api/leads/:id", async (req, res) => {
  try {
    await prisma.lead.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: "Lead not found." });
  }
});

// ---- Clients ----

app.get("/api/clients", async (req, res) => {
  const clients = await prisma.client.findMany({ orderBy: { createdAt: "desc" } });
  res.json(clients);
});

app.post("/api/clients", async (req, res) => {
  const { name, email, phone, company } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Client name is required." });
  }
  const client = await prisma.client.create({ data: { name, email, phone, company } });
  res.status(201).json(client);
});

app.patch("/api/clients/:id", async (req, res) => {
  try {
    const client = await prisma.client.update({ where: { id: req.params.id }, data: req.body });
    res.json(client);
  } catch {
    res.status(404).json({ error: "Client not found." });
  }
});

app.delete("/api/clients/:id", async (req, res) => {
  try {
    await prisma.client.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: "Client not found." });
  }
});

// ---- Deals ----

app.get("/api/deals", async (req, res) => {
  const deals = await prisma.deal.findMany({ orderBy: { createdAt: "desc" }, include: { client: true } });
  res.json(deals);
});

app.post("/api/deals", async (req, res) => {
  const { title, clientId, value, stage, closeDate } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: "Deal title is required." });
  if (!clientId) return res.status(400).json({ error: "clientId is required." });
  try {
    const deal = await prisma.deal.create({
      data: { title, clientId, value: value ?? 0, stage: stage || "prospecting", closeDate: closeDate ? new Date(closeDate) : null },
    });
    res.status(201).json(deal);
  } catch {
    res.status(400).json({ error: "Couldn't create deal — check the clientId is valid." });
  }
});

app.patch("/api/deals/:id", async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.closeDate) data.closeDate = new Date(data.closeDate);
    const deal = await prisma.deal.update({ where: { id: req.params.id }, data });
    res.json(deal);
  } catch {
    res.status(404).json({ error: "Deal not found." });
  }
});

app.delete("/api/deals/:id", async (req, res) => {
  try {
    await prisma.deal.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: "Deal not found." });
  }
});

// ---- Proposals ----

app.get("/api/proposals", async (req, res) => {
  const proposals = await prisma.proposal.findMany({ orderBy: { createdAt: "desc" }, include: { client: true, deal: true } });
  res.json(proposals);
});

app.post("/api/proposals", async (req, res) => {
  const { title, clientId, dealId, value, status } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: "Proposal title is required." });
  if (!clientId) return res.status(400).json({ error: "clientId is required." });
  try {
    const proposal = await prisma.proposal.create({
      data: { title, clientId, dealId: dealId || null, value: value ?? 0, status: status || "draft" },
    });
    res.status(201).json(proposal);
  } catch {
    res.status(400).json({ error: "Couldn't create proposal — check the clientId/dealId are valid." });
  }
});

app.patch("/api/proposals/:id", async (req, res) => {
  try {
    const proposal = await prisma.proposal.update({ where: { id: req.params.id }, data: req.body });
    res.json(proposal);
  } catch {
    res.status(404).json({ error: "Proposal not found." });
  }
});

app.delete("/api/proposals/:id", async (req, res) => {
  try {
    await prisma.proposal.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: "Proposal not found." });
  }
});

// ---- Activities ----

app.get("/api/activities", async (req, res) => {
  const activities = await prisma.activity.findMany({ orderBy: { createdAt: "desc" } });
  res.json(activities);
});

app.post("/api/activities", async (req, res) => {
  const { type, subject, notes, leadId, clientId, dealId } = req.body;
  if (!type || !subject || !subject.trim()) {
    return res.status(400).json({ error: "type and subject are required." });
  }
  const activity = await prisma.activity.create({
    data: { type, subject, notes, leadId: leadId || null, clientId: clientId || null, dealId: dealId || null },
  });
  res.status(201).json(activity);
});

app.delete("/api/activities/:id", async (req, res) => {
  try {
    await prisma.activity.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: "Activity not found." });
  }
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));