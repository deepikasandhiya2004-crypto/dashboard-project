import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { signToken, requireAuth, requireRole } from "./auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// ---- Auth ----

app.post("/api/auth/register", async (req, res) => {
  try {
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
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({
      error: err.message || "Unable to connect to the database. Please verify your DATABASE_URL in server/.env.",
      details: err.code || err.name,
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
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
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({
      error: "Unable to connect to the database. Please verify your DATABASE_URL in server/.env.",
    });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    console.error("Me error:", err.message);
    res.status(500).json({
      error: "Unable to connect to the database. Please verify your DATABASE_URL in server/.env.",
    });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required." });

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const crypto = await import("crypto");
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry },
      });

      const { sendPasswordResetEmail } = await import("./mailer.js");
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

// =========================================================
// MODULE 6 — PROJECT / DELIVERY
// =========================================================

app.use("/api/projects", requireAuth);

// List projects with search & status filter
app.get("/api/projects", async (req, res) => {
  try {
    const { search, status } = req.query;
    const where = {};
    if (status && status !== "all") {
      where.status = status;
    }
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: "insensitive" } },
        { client: { contains: search.trim(), mode: "insensitive" } },
      ];
    }
    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { tasks: true, milestones: true, team: true },
        },
      },
    });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to load projects." });
  }
});

// Create project
app.post("/api/projects", async (req, res) => {
  try {
    const { name, client, status, progress, startDate, dueDate } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Project name is required." });
    }
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        client: client?.trim() || null,
        status: status || "planning",
        progress: progress ? parseInt(progress, 10) : 0,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    // Create initial activity log
    await prisma.projectActivity.create({
      data: {
        projectId: project.id,
        action: `Project "${project.name}" was created`,
        user: req.user.name || "System",
      },
    });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to create project." });
  }
});

// Get single project details (with milestones, tasks, team, files, feedback, activity)
app.get("/api/projects/:id", async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        milestones: { orderBy: { createdAt: "desc" } },
        tasks: { orderBy: { createdAt: "desc" } },
        team: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        files: { orderBy: { uploadedAt: "desc" } },
        feedbacks: { orderBy: { createdAt: "desc" } },
        activities: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!project) return res.status(404).json({ error: "Project not found." });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch project details." });
  }
});

// Update project
app.patch("/api/projects/:id", async (req, res) => {
  try {
    const { name, client, status, progress, startDate, dueDate } = req.body;
    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (client !== undefined) data.client = client ? client.trim() : null;
    if (status !== undefined) data.status = status;
    if (progress !== undefined) data.progress = parseInt(progress, 10);
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data,
    });

    await prisma.projectActivity.create({
      data: {
        projectId: project.id,
        action: `Project updated${status ? ` (status: ${status})` : ""}`,
        user: req.user.name || "System",
      },
    });

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update project." });
  }
});

// Delete project
app.delete("/api/projects/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to delete project." });
  }
});

// Project Milestones
app.post("/api/projects/:id/milestones", async (req, res) => {
  try {
    const { title, dueDate, status } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: "Milestone title is required." });

    const milestone = await prisma.milestone.create({
      data: {
        projectId: req.params.id,
        title: title.trim(),
        status: status || "pending",
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    await prisma.projectActivity.create({
      data: {
        projectId: req.params.id,
        action: `Milestone added: "${milestone.title}"`,
        user: req.user.name || "System",
      },
    });

    res.status(201).json(milestone);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to add milestone." });
  }
});

app.patch("/api/milestones/:id", requireAuth, async (req, res) => {
  try {
    const { title, dueDate, status } = req.body;
    const data = {};
    if (title !== undefined) data.title = title.trim();
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (status !== undefined) data.status = status;

    const milestone = await prisma.milestone.update({
      where: { id: req.params.id },
      data,
    });

    await prisma.projectActivity.create({
      data: {
        projectId: milestone.projectId,
        action: `Milestone updated: "${milestone.title}" (${milestone.status})`,
        user: req.user.name || "System",
      },
    });

    res.json(milestone);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update milestone." });
  }
});

app.delete("/api/milestones/:id", requireAuth, async (req, res) => {
  try {
    await prisma.milestone.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to delete milestone." });
  }
});

// Project Team Members
app.post("/api/projects/:id/team", async (req, res) => {
  try {
    const { name, role, userId } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "Team member name is required." });

    const member = await prisma.projectMember.create({
      data: {
        projectId: req.params.id,
        name: name.trim(),
        role: role?.trim() || "Member",
        userId: userId || null,
      },
    });

    await prisma.projectActivity.create({
      data: {
        projectId: req.params.id,
        action: `Added team member: ${member.name} (${member.role})`,
        user: req.user.name || "System",
      },
    });

    res.status(201).json(member);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "This member is already assigned to the project." });
    }
    res.status(500).json({ error: err.message || "Failed to add team member." });
  }
});

app.delete("/api/projects/:projectId/team/:id", async (req, res) => {
  try {
    const member = await prisma.projectMember.delete({
      where: { id: req.params.id },
    });
    await prisma.projectActivity.create({
      data: {
        projectId: req.params.projectId,
        action: `Removed team member: ${member.name}`,
        user: req.user.name || "System",
      },
    });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to remove team member." });
  }
});

// Project Files (Metadata structure)
app.post("/api/projects/:id/files", async (req, res) => {
  try {
    const { name, size, type } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "File name is required." });

    const file = await prisma.projectFile.create({
      data: {
        projectId: req.params.id,
        name: name.trim(),
        size: size || "Unknown",
        type: type || "Document",
      },
    });

    await prisma.projectActivity.create({
      data: {
        projectId: req.params.id,
        action: `Attached file record: "${file.name}"`,
        user: req.user.name || "System",
      },
    });

    res.status(201).json(file);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to add file record." });
  }
});

app.delete("/api/projects/:projectId/files/:id", async (req, res) => {
  try {
    await prisma.projectFile.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to remove file record." });
  }
});

// Client Feedback
app.post("/api/projects/:id/feedbacks", async (req, res) => {
  try {
    const { clientName, rating, comment, status } = req.body;
    if (!clientName || !clientName.trim() || !comment || !comment.trim()) {
      return res.status(400).json({ error: "Client name and comment are required." });
    }

    const feedback = await prisma.clientFeedback.create({
      data: {
        projectId: req.params.id,
        clientName: clientName.trim(),
        rating: rating ? parseInt(rating, 10) : 5,
        comment: comment.trim(),
        status: status || "reviewed",
      },
    });

    await prisma.projectActivity.create({
      data: {
        projectId: req.params.id,
        action: `Received client feedback from ${feedback.clientName} (${feedback.rating}★)`,
        user: req.user.name || "System",
      },
    });

    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to add client feedback." });
  }
});

// =========================================================
// MODULE 7 — TASKS
// =========================================================

app.use("/api/tasks", requireAuth);

// List tasks with filtering: my, team, all, status, priority, projectId, search
app.get("/api/tasks", async (req, res) => {
  try {
    const { my, team, status, priority, projectId, assignee, search } = req.query;
    const where = {};

    const currentUser = req.user.name || "";

    if (my === "true") {
      where.assignee = { equals: currentUser, mode: "insensitive" };
    } else if (team === "true") {
      where.NOT = { assignee: { equals: currentUser, mode: "insensitive" } };
    } else if (assignee && assignee.trim() && assignee !== "all") {
      where.assignee = { equals: assignee.trim(), mode: "insensitive" };
    }

    if (status && status !== "all") {
      where.status = status;
    }
    if (priority && priority !== "all") {
      where.priority = priority;
    }
    if (projectId && projectId !== "all") {
      where.projectId = projectId;
    }
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: "insensitive" } },
        { assignee: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: { id: true, name: true, client: true },
        },
      },
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to load tasks." });
  }
});

// Get single task details
app.get("/api/tasks/:id", async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        project: {
          select: { id: true, name: true, client: true },
        },
      },
    });
    if (!task) return res.status(404).json({ error: "Task not found." });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch task." });
  }
});

// Create task
app.post("/api/tasks", async (req, res) => {
  try {
    const { title, assignee, priority, status, dueDate, projectId } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Task title is required." });
    }
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        assignee: assignee?.trim() || null,
        priority: priority || "medium",
        status: status || "todo",
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: projectId || null,
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    if (projectId) {
      await prisma.projectActivity.create({
        data: {
          projectId,
          action: `Created task: "${task.title}"`,
          user: req.user.name || "System",
        },
      });
    }

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to create task." });
  }
});

// Update task
app.patch("/api/tasks/:id", async (req, res) => {
  try {
    const { title, assignee, priority, status, dueDate, projectId } = req.body;
    const data = {};
    if (title !== undefined) data.title = title.trim();
    if (assignee !== undefined) data.assignee = assignee ? assignee.trim() : null;
    if (priority !== undefined) data.priority = priority;
    if (status !== undefined) data.status = status;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (projectId !== undefined) data.projectId = projectId || null;

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data,
      include: {
        project: { select: { id: true, name: true } },
      },
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update task." });
  }
});

// Delete task
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to delete task." });
  }
});

// =========================================================
// MODULE 5 — CRM (Leads, Clients, Deals, Proposals, Activities)
// =========================================================

app.use("/api/leads", requireAuth);
app.use("/api/clients", requireAuth);
app.use("/api/deals", requireAuth);
app.use("/api/proposals", requireAuth);
app.use("/api/activities", requireAuth);

app.get("/api/leads", async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to load leads." });
  }
});

app.post("/api/leads", async (req, res) => {
  try {
    const { name, email, phone, source, status, value } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "Lead name is required." });
    const lead = await prisma.lead.create({
      data: { name: name.trim(), email, phone, source, status: status || "new", value: value ?? 0 },
    });
    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to create lead." });
  }
});

app.patch("/api/leads/:id", async (req, res) => {
  try {
    const lead = await prisma.lead.update({ where: { id: req.params.id }, data: req.body });
    res.json(lead);
  } catch (err) {
    res.status(404).json({ error: "Lead not found." });
  }
});

app.delete("/api/leads/:id", async (req, res) => {
  try {
    await prisma.lead.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    res.status(404).json({ error: "Lead not found." });
  }
});

app.get("/api/clients", async (req, res) => {
  try {
    const clients = await prisma.client.findMany({ orderBy: { createdAt: "desc" } });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to load clients." });
  }
});

app.post("/api/clients", async (req, res) => {
  try {
    const { name, email, phone, company } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "Client name is required." });
    const client = await prisma.client.create({ data: { name: name.trim(), email, phone, company } });
    res.status(201).json(client);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to create client." });
  }
});

app.patch("/api/clients/:id", async (req, res) => {
  try {
    const client = await prisma.client.update({ where: { id: req.params.id }, data: req.body });
    res.json(client);
  } catch (err) {
    res.status(404).json({ error: "Client not found." });
  }
});

app.delete("/api/clients/:id", async (req, res) => {
  try {
    await prisma.client.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    res.status(404).json({ error: "Client not found." });
  }
});

app.get("/api/deals", async (req, res) => {
  try {
    const deals = await prisma.deal.findMany({ orderBy: { createdAt: "desc" }, include: { client: true } });
    res.json(deals);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to load deals." });
  }
});

app.post("/api/deals", async (req, res) => {
  const { title, clientId, value, stage, closeDate } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: "Deal title is required." });
  if (!clientId) return res.status(400).json({ error: "clientId is required." });
  try {
    const deal = await prisma.deal.create({
      data: {
        title: title.trim(),
        clientId,
        value: value ?? 0,
        stage: stage || "prospecting",
        closeDate: closeDate ? new Date(closeDate) : null,
      },
    });
    res.status(201).json(deal);
  } catch (err) {
    res.status(400).json({ error: "Couldn't create deal — check the clientId is valid." });
  }
});

app.patch("/api/deals/:id", async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.closeDate) data.closeDate = new Date(data.closeDate);
    const deal = await prisma.deal.update({ where: { id: req.params.id }, data });
    res.json(deal);
  } catch (err) {
    res.status(404).json({ error: "Deal not found." });
  }
});

app.delete("/api/deals/:id", async (req, res) => {
  try {
    await prisma.deal.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    res.status(404).json({ error: "Deal not found." });
  }
});

app.get("/api/proposals", async (req, res) => {
  try {
    const proposals = await prisma.proposal.findMany({
      orderBy: { createdAt: "desc" },
      include: { client: true, deal: true },
    });
    res.json(proposals);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to load proposals." });
  }
});

app.post("/api/proposals", async (req, res) => {
  const { title, clientId, dealId, value, status } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: "Proposal title is required." });
  if (!clientId) return res.status(400).json({ error: "clientId is required." });
  try {
    const proposal = await prisma.proposal.create({
      data: {
        title: title.trim(),
        clientId,
        dealId: dealId || null,
        value: value ?? 0,
        status: status || "draft",
      },
    });
    res.status(201).json(proposal);
  } catch (err) {
    res.status(400).json({ error: "Couldn't create proposal — check the clientId/dealId are valid." });
  }
});

app.patch("/api/proposals/:id", async (req, res) => {
  try {
    const proposal = await prisma.proposal.update({ where: { id: req.params.id }, data: req.body });
    res.json(proposal);
  } catch (err) {
    res.status(404).json({ error: "Proposal not found." });
  }
});

app.delete("/api/proposals/:id", async (req, res) => {
  try {
    await prisma.proposal.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    res.status(404).json({ error: "Proposal not found." });
  }
});

app.get("/api/activities", async (req, res) => {
  try {
    const activities = await prisma.activity.findMany({ orderBy: { createdAt: "desc" } });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to load activities." });
  }
});

app.post("/api/activities", async (req, res) => {
  const { type, subject, notes, leadId, clientId, dealId } = req.body;
  if (!type || !subject || !subject.trim()) {
    return res.status(400).json({ error: "type and subject are required." });
  }
  try {
    const activity = await prisma.activity.create({
      data: {
        type,
        subject: subject.trim(),
        notes,
        leadId: leadId || null,
        clientId: clientId || null,
        dealId: dealId || null,
      },
    });
    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to create activity." });
  }
});

app.delete("/api/activities/:id", async (req, res) => {
  try {
    await prisma.activity.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    res.status(404).json({ error: "Activity not found." });
  }
});

// =========================================================
// MODULE 8 — MARKETING
// =========================================================

app.use("/api/marketing", requireAuth);

// Campaigns CRUD
app.get("/api/marketing/campaigns", async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { leads: true } },
      },
    });
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to load campaigns." });
  }
});

app.post("/api/marketing/campaigns", async (req, res) => {
  try {
    const { name, status, startDate, endDate, budget } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "Campaign name is required." });

    const campaign = await prisma.campaign.create({
      data: {
        name: name.trim(),
        status: status || "planning",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: budget ? parseFloat(budget) : 0,
      },
    });
    res.status(201).json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to create campaign." });
  }
});

app.patch("/api/marketing/campaigns/:id", async (req, res) => {
  try {
    const { name, status, startDate, endDate, budget } = req.body;
    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (status !== undefined) data.status = status;
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
    if (budget !== undefined) data.budget = parseFloat(budget);

    const campaign = await prisma.campaign.update({
      where: { id: req.params.id },
      data,
    });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update campaign." });
  }
});

app.delete("/api/marketing/campaigns/:id", async (req, res) => {
  try {
    await prisma.campaign.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to delete campaign." });
  }
});

// Marketing Leads CRUD
app.get("/api/marketing/leads", async (req, res) => {
  try {
    const leads = await prisma.marketingLead.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        campaign: { select: { id: true, name: true } },
      },
    });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to load marketing leads." });
  }
});

app.post("/api/marketing/leads", async (req, res) => {
  try {
    const { name, email, source, status, campaignId } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "Lead name is required." });

    const lead = await prisma.marketingLead.create({
      data: {
        name: name.trim(),
        email: email ? email.trim() : null,
        source: source || "website",
        status: status || "new",
        campaignId: campaignId || null,
      },
      include: {
        campaign: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to create marketing lead." });
  }
});

app.patch("/api/marketing/leads/:id", async (req, res) => {
  try {
    const { name, email, source, status, campaignId } = req.body;
    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (email !== undefined) data.email = email ? email.trim() : null;
    if (source !== undefined) data.source = source;
    if (status !== undefined) data.status = status;
    if (campaignId !== undefined) data.campaignId = campaignId || null;

    const lead = await prisma.marketingLead.update({
      where: { id: req.params.id },
      data,
      include: {
        campaign: { select: { id: true, name: true } },
      },
    });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update marketing lead." });
  }
});

app.delete("/api/marketing/leads/:id", async (req, res) => {
  try {
    await prisma.marketingLead.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to delete marketing lead." });
  }
});

// Content CRUD
app.get("/api/marketing/content", async (req, res) => {
  try {
    const content = await prisma.marketingContent.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(content);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to load content." });
  }
});

app.post("/api/marketing/content", async (req, res) => {
  try {
    const { title, type, status, publishDate, author } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: "Content title is required." });

    const item = await prisma.marketingContent.create({
      data: {
        title: title.trim(),
        type: type || "blog",
        status: status || "draft",
        publishDate: publishDate ? new Date(publishDate) : null,
        author: author ? author.trim() : (req.user.name || null),
      },
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to create content." });
  }
});

app.patch("/api/marketing/content/:id", async (req, res) => {
  try {
    const { title, type, status, publishDate, author } = req.body;
    const data = {};
    if (title !== undefined) data.title = title.trim();
    if (type !== undefined) data.type = type;
    if (status !== undefined) data.status = status;
    if (publishDate !== undefined) data.publishDate = publishDate ? new Date(publishDate) : null;
    if (author !== undefined) data.author = author ? author.trim() : null;

    const item = await prisma.marketingContent.update({
      where: { id: req.params.id },
      data,
    });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update content." });
  }
});

app.delete("/api/marketing/content/:id", async (req, res) => {
  try {
    await prisma.marketingContent.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to delete content." });
  }
});

// Social Media Posts CRUD
app.get("/api/marketing/social", async (req, res) => {
  try {
    const posts = await prisma.socialPost.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to load social posts." });
  }
});

app.post("/api/marketing/social", async (req, res) => {
  try {
    const { platform, content, status, scheduledDate } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: "Post content is required." });

    const post = await prisma.socialPost.create({
      data: {
        platform: platform || "linkedin",
        content: content.trim(),
        status: status || "draft",
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      },
    });
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to create social post." });
  }
});

app.patch("/api/marketing/social/:id", async (req, res) => {
  try {
    const { platform, content, status, scheduledDate } = req.body;
    const data = {};
    if (platform !== undefined) data.platform = platform;
    if (content !== undefined) data.content = content.trim();
    if (status !== undefined) data.status = status;
    if (scheduledDate !== undefined) data.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;

    const post = await prisma.socialPost.update({
      where: { id: req.params.id },
      data,
    });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update social post." });
  }
});

app.delete("/api/marketing/social/:id", async (req, res) => {
  try {
    await prisma.socialPost.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to delete social post." });
  }
});

// Marketing Analytics derived from real database
app.get("/api/marketing/analytics", async (req, res) => {
  try {
    const [campaigns, leads, contents, posts] = await Promise.all([
      prisma.campaign.findMany(),
      prisma.marketingLead.findMany(),
      prisma.marketingContent.findMany(),
      prisma.socialPost.findMany(),
    ]);

    const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    const activeCampaigns = campaigns.filter((c) => c.status === "active").length;

    const leadsByStatus = {
      new: leads.filter((l) => l.status === "new").length,
      contacted: leads.filter((l) => l.status === "contacted").length,
      qualified: leads.filter((l) => l.status === "qualified").length,
      converted: leads.filter((l) => l.status === "converted").length,
      lost: leads.filter((l) => l.status === "lost").length,
    };

    const leadsBySource = {};
    for (const lead of leads) {
      const src = lead.source || "other";
      leadsBySource[src] = (leadsBySource[src] || 0) + 1;
    }

    const contentStats = {
      total: contents.length,
      published: contents.filter((c) => c.status === "published").length,
      draft: contents.filter((c) => c.status === "draft").length,
      review: contents.filter((c) => c.status === "review").length,
    };

    const socialStats = {
      total: posts.length,
      scheduled: posts.filter((p) => p.status === "scheduled").length,
      published: posts.filter((p) => p.status === "published").length,
    };

    res.json({
      totalCampaigns: campaigns.length,
      activeCampaigns,
      totalBudget,
      totalLeads: leads.length,
      leadsByStatus,
      leadsBySource,
      contentStats,
      socialStats,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to generate marketing analytics." });
  }
});

// =========================================================
// MODULE 9 — CALENDAR
// =========================================================

app.use("/api/calendar", requireAuth);

// Meetings CRUD
app.get("/api/calendar/meetings", async (req, res) => {
  try {
    const meetings = await prisma.meeting.findMany({
      orderBy: { date: "asc" },
    });
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to load meetings." });
  }
});

app.post("/api/calendar/meetings", async (req, res) => {
  try {
    const { title, date, startTime, endTime, attendees, location } = req.body;
    if (!title || !title.trim() || !date || !startTime || !endTime) {
      return res.status(400).json({ error: "Title, date, start time, and end time are required." });
    }

    const meeting = await prisma.meeting.create({
      data: {
        title: title.trim(),
        date: new Date(date),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        attendees: attendees ? attendees.trim() : null,
        location: location ? location.trim() : null,
      },
    });
    res.status(201).json(meeting);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to create meeting." });
  }
});

app.patch("/api/calendar/meetings/:id", async (req, res) => {
  try {
    const { title, date, startTime, endTime, attendees, location } = req.body;
    const data = {};
    if (title !== undefined) data.title = title.trim();
    if (date !== undefined) data.date = new Date(date);
    if (startTime !== undefined) data.startTime = startTime.trim();
    if (endTime !== undefined) data.endTime = endTime.trim();
    if (attendees !== undefined) data.attendees = attendees ? attendees.trim() : null;
    if (location !== undefined) data.location = location ? location.trim() : null;

    const meeting = await prisma.meeting.update({
      where: { id: req.params.id },
      data,
    });
    res.json(meeting);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update meeting." });
  }
});

app.delete("/api/calendar/meetings/:id", async (req, res) => {
  try {
    await prisma.meeting.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to delete meeting." });
  }
});

// Follow-ups CRUD
app.get("/api/calendar/followups", async (req, res) => {
  try {
    const followups = await prisma.followUp.findMany({
      orderBy: { date: "asc" },
    });
    res.json(followups);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to load follow-ups." });
  }
});

app.post("/api/calendar/followups", async (req, res) => {
  try {
    const { title, date, client, notes, status } = req.body;
    if (!title || !title.trim() || !date) {
      return res.status(400).json({ error: "Title and date are required." });
    }

    const followup = await prisma.followUp.create({
      data: {
        title: title.trim(),
        date: new Date(date),
        client: client ? client.trim() : null,
        notes: notes ? notes.trim() : null,
        status: status || "pending",
      },
    });
    res.status(201).json(followup);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to create follow-up." });
  }
});

app.patch("/api/calendar/followups/:id", async (req, res) => {
  try {
    const { title, date, client, notes, status } = req.body;
    const data = {};
    if (title !== undefined) data.title = title.trim();
    if (date !== undefined) data.date = new Date(date);
    if (client !== undefined) data.client = client ? client.trim() : null;
    if (notes !== undefined) data.notes = notes ? notes.trim() : null;
    if (status !== undefined) data.status = status;

    const followup = await prisma.followUp.update({
      where: { id: req.params.id },
      data,
    });
    res.json(followup);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update follow-up." });
  }
});

app.delete("/api/calendar/followups/:id", async (req, res) => {
  try {
    await prisma.followUp.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to delete follow-up." });
  }
});

// All Calendar Events combined (Meetings, Follow-ups, Deadlines, Milestones)
app.get("/api/calendar/events", async (req, res) => {
  try {
    const [meetings, followups, tasks, projects, milestones] = await Promise.all([
      prisma.meeting.findMany({ orderBy: { date: "asc" } }),
      prisma.followUp.findMany({ orderBy: { date: "asc" } }),
      prisma.task.findMany({
        where: { dueDate: { not: null } },
        include: { project: { select: { id: true, name: true } } },
      }),
      prisma.project.findMany({
        where: { dueDate: { not: null } },
      }),
      prisma.milestone.findMany({
        where: { dueDate: { not: null } },
        include: { project: { select: { id: true, name: true } } },
      }),
    ]);

    const events = [];

    meetings.forEach((m) => {
      events.push({
        id: `meeting-${m.id}`,
        rawId: m.id,
        type: "meeting",
        title: m.title,
        date: m.date,
        startTime: m.startTime,
        endTime: m.endTime,
        attendees: m.attendees,
        location: m.location,
      });
    });

    followups.forEach((f) => {
      events.push({
        id: `followup-${f.id}`,
        rawId: f.id,
        type: "follow_up",
        title: f.title,
        date: f.date,
        client: f.client,
        notes: f.notes,
        status: f.status,
      });
    });

    tasks.forEach((t) => {
      events.push({
        id: `task-${t.id}`,
        rawId: t.id,
        type: "deadline",
        title: `Task Deadline: ${t.title}`,
        date: t.dueDate,
        status: t.status,
        priority: t.priority,
        projectName: t.project?.name,
      });
    });

    projects.forEach((p) => {
      events.push({
        id: `project-${p.id}`,
        rawId: p.id,
        type: "deadline",
        title: `Project Deadline: ${p.name}`,
        date: p.dueDate,
        status: p.status,
        client: p.client,
      });
    });

    milestones.forEach((ms) => {
      events.push({
        id: `milestone-${ms.id}`,
        rawId: ms.id,
        type: "milestone",
        title: `Milestone: ${ms.title}`,
        date: ms.dueDate,
        status: ms.status,
        projectName: ms.project?.name,
      });
    });

    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to load calendar events." });
  }
});

// Health check
app.get("/api/health", (req, res) => res.json({ ok: true }));



// =========================================================
// MODULE 10 — FINANCE (QUOTATIONS)
// =========================================================

app.use("/api/quotations", requireAuth);

// GET ALL QUOTATIONS
app.get("/api/quotations", async (req, res) => {
  try {
    const quotations = await prisma.quotation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        items: true,
        invoice: true,
      },
    });

    res.json(quotations);
  } catch (err) {
    console.error("Get quotations error:", err);
    res.status(500).json({
      error: err.message || "Failed to load quotations.",
    });
  }
});

// CREATE QUOTATION
app.post("/api/quotations", async (req, res) => {
  try {
    const {
      clientId,
      issueDate,
      validUntil,
      status,
      discount,
      tax,
      notes,
      items,
    } = req.body;

    if (!clientId) {
      return res.status(400).json({
        error: "clientId is required.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "At least one quotation item is required.",
      });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return res.status(400).json({
        error: "Client not found.",
      });
    }

    const preparedItems = items
      .filter(
        (item) =>
          String(item.description || "").trim() &&
          Number(item.quantity) > 0 &&
          Number(item.unitPrice) >= 0
      )
      .map((item) => {
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);

        return {
          description: String(item.description).trim(),
          quantity,
          unitPrice,
          total: quantity * unitPrice,
        };
      });

    if (preparedItems.length === 0) {
      return res.status(400).json({
        error: "At least one valid quotation item is required.",
      });
    }

    const subtotal = preparedItems.reduce(
      (sum, item) => sum + item.total,
      0
    );

    const discountAmount = Number(discount) || 0;
    const taxAmount = Number(tax) || 0;

    const total = Math.max(
      0,
      subtotal - discountAmount + taxAmount
    );

    const quotationNo = `QT-${Date.now()}`;

    const quotation = await prisma.quotation.create({
      data: {
        quotationNo,
        clientId,

        issueDate: issueDate
          ? new Date(issueDate)
          : new Date(),

        validUntil: validUntil
          ? new Date(validUntil)
          : null,

        status: status || "draft",

        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        total,

        notes: notes || null,

        items: {
          create: preparedItems,
        },
      },

      include: {
        client: true,
        items: true,
        invoice: true,
      },
    });

    res.status(201).json(quotation);
  } catch (err) {
    console.error("Create quotation error:", err);

    res.status(500).json({
      error: err.message || "Failed to create quotation.",
    });
  }
});

// GET SINGLE QUOTATION
app.get("/api/quotations/:id", async (req, res) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        client: true,
        items: true,
        invoice: true,
      },
    });

    if (!quotation) {
      return res.status(404).json({
        error: "Quotation not found.",
      });
    }

    res.json(quotation);
  } catch (err) {
    console.error("Get quotation error:", err);

    res.status(500).json({
      error: err.message || "Failed to load quotation.",
    });
  }
});

// UPDATE QUOTATION
app.patch("/api/quotations/:id", async (req, res) => {
  try {
    const {
      status,
      validUntil,
      discount,
      tax,
      notes,
      items,
    } = req.body;

    const quotation = await prisma.quotation.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        items: true,
      },
    });

    if (!quotation) {
      return res.status(404).json({
        error: "Quotation not found.",
      });
    }

    let preparedItems = quotation.items;

    if (Array.isArray(items) && items.length > 0) {
      preparedItems = items
        .filter(
          (item) =>
            String(item.description || "").trim() &&
            Number(item.quantity) > 0 &&
            Number(item.unitPrice) >= 0
        )
        .map((item) => {
          const quantity = Number(item.quantity);
          const unitPrice = Number(item.unitPrice);

          return {
            description: String(item.description).trim(),
            quantity,
            unitPrice,
            total: quantity * unitPrice,
          };
        });

      if (preparedItems.length === 0) {
        return res.status(400).json({
          error: "At least one valid quotation item is required.",
        });
      }
    }

    const subtotal = preparedItems.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0
    );

    const discountAmount =
      Number(discount ?? quotation.discount) || 0;

    const taxAmount =
      Number(tax ?? quotation.tax) || 0;

    const total = Math.max(
      0,
      subtotal - discountAmount + taxAmount
    );

    const updatedQuotation = await prisma.$transaction(
      async (tx) => {
        if (Array.isArray(items)) {
          await tx.quotationItem.deleteMany({
            where: {
              quotationId: quotation.id,
            },
          });
        }

        return tx.quotation.update({
          where: {
            id: quotation.id,
          },

          data: {
            ...(status !== undefined && {
              status,
            }),

            ...(validUntil !== undefined && {
              validUntil: validUntil
                ? new Date(validUntil)
                : null,
            }),

            subtotal,
            discount: discountAmount,
            tax: taxAmount,
            total,

            ...(notes !== undefined && {
              notes,
            }),

            ...(Array.isArray(items) && {
              items: {
                create: preparedItems,
              },
            }),
          },

          include: {
            client: true,
            items: true,
            invoice: true,
          },
        });
      }
    );

    res.json(updatedQuotation);
  } catch (err) {
    console.error("Update quotation error:", err);

    res.status(500).json({
      error: err.message || "Failed to update quotation.",
    });
  }
});

// DELETE QUOTATION
app.delete("/api/quotations/:id", async (req, res) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!quotation) {
      return res.status(404).json({
        error: "Quotation not found.",
      });
    }

    await prisma.quotation.delete({
      where: {
        id: req.params.id,
      },
    });

    res.json({
      message: "Quotation deleted successfully.",
    });
  } catch (err) {
    console.error("Delete quotation error:", err);

    res.status(500).json({
      error: err.message || "Failed to delete quotation.",
    });
  }
});
// =========================================================
// MODULE 11 — FINANCE (INVOICES)
// =========================================================

app.use("/api/invoices", requireAuth);

// GET ALL INVOICES
app.get("/api/invoices", async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        quotation: true,
        items: true,
        payments: true,
        transactions: true,
      },
    });

    res.json(invoices);
  } catch (err) {
    console.error("Get invoices error:", err);

    res.status(500).json({
      error: err.message || "Failed to load invoices.",
    });
  }
});

// CREATE INVOICE
app.post("/api/invoices", async (req, res) => {
  try {
    const {
      clientId,
      quotationId,
      issueDate,
      dueDate,
      status,
      discount,
      tax,
      notes,
      items,
    } = req.body;

    if (!clientId) {
      return res.status(400).json({
        error: "clientId is required.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "At least one invoice item is required.",
      });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return res.status(400).json({
        error: "Client not found.",
      });
    }

    const preparedItems = items
      .filter(
        (item) =>
          String(item.description || "").trim() &&
          Number(item.quantity) > 0 &&
          Number(item.unitPrice) >= 0
      )
      .map((item) => {
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);

        return {
          description: String(item.description).trim(),
          quantity,
          unitPrice,
          total: quantity * unitPrice,
        };
      });

    if (preparedItems.length === 0) {
      return res.status(400).json({
        error: "At least one valid invoice item is required.",
      });
    }

    const subtotal = preparedItems.reduce(
      (sum, item) => sum + item.total,
      0
    );

    const discountAmount = Number(discount) || 0;
    const taxAmount = Number(tax) || 0;

    const total = Math.max(
      0,
      subtotal - discountAmount + taxAmount
    );

    const invoiceNo = `INV-${Date.now()}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        clientId,

        quotationId: quotationId || null,

        issueDate: issueDate
          ? new Date(issueDate)
          : new Date(),

        dueDate: dueDate
          ? new Date(dueDate)
          : null,

        status: status || "draft",

        subtotal,
        discount: discountAmount,
        tax: taxAmount,

        total,

        paidAmount: 0,
        balanceAmount: total,

        notes: notes || null,

        items: {
          create: preparedItems,
        },
      },

      include: {
        client: true,
        quotation: true,
        items: true,
        payments: true,
        transactions: true,
      },
    });

    res.status(201).json(invoice);
  } catch (err) {
    console.error("Create invoice error:", err);

    res.status(500).json({
      error: err.message || "Failed to create invoice.",
    });
  }
});

// GET SINGLE INVOICE
app.get("/api/invoices/:id", async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: req.params.id,
      },

      include: {
        client: true,
        quotation: true,
        items: true,
        payments: true,
        transactions: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        error: "Invoice not found.",
      });
    }

    res.json(invoice);
  } catch (err) {
    console.error("Get invoice error:", err);

    res.status(500).json({
      error: err.message || "Failed to load invoice.",
    });
  }
});

// UPDATE INVOICE
app.patch("/api/invoices/:id", async (req, res) => {
  try {
    const {
      status,
      dueDate,
      discount,
      tax,
      notes,
      items,
    } = req.body;

    const invoice = await prisma.invoice.findUnique({
      where: {
        id: req.params.id,
      },

      include: {
        items: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        error: "Invoice not found.",
      });
    }

    let preparedItems = invoice.items;

    if (Array.isArray(items) && items.length > 0) {
      preparedItems = items
        .filter(
          (item) =>
            String(item.description || "").trim() &&
            Number(item.quantity) > 0 &&
            Number(item.unitPrice) >= 0
        )
        .map((item) => {
          const quantity = Number(item.quantity);
          const unitPrice = Number(item.unitPrice);

          return {
            description: String(item.description).trim(),
            quantity,
            unitPrice,
            total: quantity * unitPrice,
          };
        });

      if (preparedItems.length === 0) {
        return res.status(400).json({
          error: "At least one valid invoice item is required.",
        });
      }
    }

    const subtotal = preparedItems.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0
    );

    const discountAmount =
      Number(discount ?? invoice.discount) || 0;

    const taxAmount =
      Number(tax ?? invoice.tax) || 0;

    const total = Math.max(
      0,
      subtotal - discountAmount + taxAmount
    );

    const paidAmount = Number(invoice.paidAmount) || 0;

    const balanceAmount = Math.max(
      0,
      total - paidAmount
    );

    const updatedInvoice = await prisma.$transaction(
      async (tx) => {
        if (Array.isArray(items)) {
          await tx.invoiceItem.deleteMany({
            where: {
              invoiceId: invoice.id,
            },
          });
        }

        return tx.invoice.update({
          where: {
            id: invoice.id,
          },

          data: {
            ...(status !== undefined && {
              status,
            }),

            ...(dueDate !== undefined && {
              dueDate: dueDate
                ? new Date(dueDate)
                : null,
            }),

            subtotal,
            discount: discountAmount,
            tax: taxAmount,
            total,
            balanceAmount,

            ...(notes !== undefined && {
              notes,
            }),

            ...(Array.isArray(items) && {
              items: {
                create: preparedItems,
              },
            }),
          },

          include: {
            client: true,
            quotation: true,
            items: true,
            payments: true,
            transactions: true,
          },
        });
      }
    );

    res.json(updatedInvoice);
  } catch (err) {
    console.error("Update invoice error:", err);

    res.status(500).json({
      error: err.message || "Failed to update invoice.",
    });
  }
});

// DELETE INVOICE
app.delete("/api/invoices/:id", async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        error: "Invoice not found.",
      });
    }

    await prisma.invoice.delete({
      where: {
        id: req.params.id,
      },
    });

    res.json({
      message: "Invoice deleted successfully.",
    });
  } catch (err) {
    console.error("Delete invoice error:", err);

    res.status(500).json({
      error: err.message || "Failed to delete invoice.",
    });
  }
});
// =========================================================
// MODULE 12 — FINANCE (PAYMENTS)
// =========================================================

app.use("/api/payments", requireAuth);

// GET ALL PAYMENTS
app.get("/api/payments", async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { paymentDate: "desc" },
      include: {
        client: true,
        invoice: true,
      },
    });

    res.json(payments);
  } catch (err) {
    console.error("Get payments error:", err);

    res.status(500).json({
      error: err.message || "Failed to load payments.",
    });
  }
});

// CREATE PAYMENT
app.post("/api/payments", async (req, res) => {
  try {
    const {
      clientId,
      invoiceId,
      amount,
      paymentDate,
      method,
      reference,
      notes,
    } = req.body;

    if (!clientId) {
      return res.status(400).json({
        error: "clientId is required.",
      });
    }

    if (!invoiceId) {
      return res.status(400).json({
        error: "invoiceId is required.",
      });
    }

    const paymentAmount = Number(amount);

    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({
        error: "Payment amount must be greater than 0.",
      });
    }

    const invoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        error: "Invoice not found.",
      });
    }

    const currentPaidAmount = Number(invoice.paidAmount) || 0;
    const invoiceTotal = Number(invoice.total) || 0;
    const currentBalance = Math.max(
      0,
      invoiceTotal - currentPaidAmount
    );

    if (paymentAmount > currentBalance) {
      return res.status(400).json({
        error: `Payment cannot exceed the remaining balance of ${currentBalance}.`,
      });
    }

    const newPaidAmount = currentPaidAmount + paymentAmount;
    const newBalanceAmount = Math.max(
      0,
      invoiceTotal - newPaidAmount
    );

    let invoiceStatus = "partially_paid";

    if (newBalanceAmount === 0) {
      invoiceStatus = "paid";
    }

    const paymentNo = `PAY-${Date.now()}`;

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          paymentNo,
          clientId,
          invoiceId,
          amount: paymentAmount,
          paymentDate: paymentDate
            ? new Date(paymentDate)
            : new Date(),
          method: method || "bank_transfer",
          reference: reference || null,
          notes: notes || null,
        },
        include: {
          client: true,
          invoice: true,
        },
      });

      const updatedInvoice = await tx.invoice.update({
        where: {
          id: invoiceId,
        },
        data: {
          paidAmount: newPaidAmount,
          balanceAmount: newBalanceAmount,
          status: invoiceStatus,
        },
      });

      return {
        payment,
        invoice: updatedInvoice,
      };
    });

    res.status(201).json(result);
  } catch (err) {
    console.error("Create payment error:", err);

    res.status(500).json({
      error: err.message || "Failed to create payment.",
    });
  }
});

// GET SINGLE PAYMENT
app.get("/api/payments/:id", async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        client: true,
        invoice: true,
      },
    });

    if (!payment) {
      return res.status(404).json({
        error: "Payment not found.",
      });
    }

    res.json(payment);
  } catch (err) {
    console.error("Get payment error:", err);

    res.status(500).json({
      error: err.message || "Failed to load payment.",
    });
  }
});

// DELETE PAYMENT
app.delete("/api/payments/:id", async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!payment) {
      return res.status(404).json({
        error: "Payment not found.",
      });
    }

    const invoice = await prisma.invoice.findUnique({
      where: {
        id: payment.invoiceId,
      },
    });

    await prisma.$transaction(async (tx) => {
      await tx.payment.delete({
        where: {
          id: payment.id,
        },
      });

      if (invoice) {
        const newPaidAmount = Math.max(
          0,
          Number(invoice.paidAmount) - Number(payment.amount)
        );

        const newBalanceAmount = Math.max(
          0,
          Number(invoice.total) - newPaidAmount
        );

        let invoiceStatus = "sent";

        if (newPaidAmount > 0 && newBalanceAmount > 0) {
          invoiceStatus = "partially_paid";
        }

        await tx.invoice.update({
          where: {
            id: invoice.id,
          },
          data: {
            paidAmount: newPaidAmount,
            balanceAmount: newBalanceAmount,
            status: invoiceStatus,
          },
        });
      }
    });

    res.json({
      message: "Payment deleted successfully.",
    });
  } catch (err) {
    console.error("Delete payment error:", err);

    res.status(500).json({
      error: err.message || "Failed to delete payment.",
    });
  }
});
// =========================================================
// MODULE 13 — FINANCE (TRANSACTIONS)
// =========================================================

app.use("/api/transactions", requireAuth);

// GET ALL TRANSACTIONS
app.get("/api/transactions", async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: {
        transactionDate: "desc",
      },
      include: {
        client: true,
        invoice: true,
      },
    });

    res.json(transactions);
  } catch (err) {
    console.error("Get transactions error:", err);

    res.status(500).json({
      error: err.message || "Failed to load transactions.",
    });
  }
});


// CREATE TRANSACTION
app.post("/api/transactions", async (req, res) => {
  try {
    const {
      clientId,
      invoiceId,
      type,
      category,
      amount,
      description,
      transactionDate,
      reference,
    } = req.body;

    if (!type) {
      return res.status(400).json({
        error: "Transaction type is required.",
      });
    }

    if (!category) {
      return res.status(400).json({
        error: "Transaction category is required.",
      });
    }

    const transactionAmount = Number(amount);

    if (!transactionAmount || transactionAmount <= 0) {
      return res.status(400).json({
        error: "Transaction amount must be greater than 0.",
      });
    }

    if (clientId) {
      const client = await prisma.client.findUnique({
        where: {
          id: clientId,
        },
      });

      if (!client) {
        return res.status(400).json({
          error: "Client not found.",
        });
      }
    }

    if (invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: {
          id: invoiceId,
        },
      });

      if (!invoice) {
        return res.status(400).json({
          error: "Invoice not found.",
        });
      }
    }

    const transactionNo = `TXN-${Date.now()}`;

    const transaction = await prisma.transaction.create({
      data: {
        transactionNo,
        clientId: clientId || null,
        invoiceId: invoiceId || null,
        type,
        category,
        amount: transactionAmount,
        description: description?.trim() || null,
        transactionDate: transactionDate
          ? new Date(transactionDate)
          : new Date(),
        reference: reference?.trim() || null,
      },
      include: {
        client: true,
        invoice: true,
      },
    });

    res.status(201).json(transaction);
  } catch (err) {
    console.error("Create transaction error:", err);

    res.status(500).json({
      error: err.message || "Failed to create transaction.",
    });
  }
});


// GET SINGLE TRANSACTION
app.get("/api/transactions/:id", async (req, res) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        client: true,
        invoice: true,
      },
    });

    if (!transaction) {
      return res.status(404).json({
        error: "Transaction not found.",
      });
    }

    res.json(transaction);
  } catch (err) {
    console.error("Get transaction error:", err);

    res.status(500).json({
      error: err.message || "Failed to load transaction.",
    });
  }
});


// UPDATE TRANSACTION
app.patch("/api/transactions/:id", async (req, res) => {
  try {
    const {
      type,
      category,
      amount,
      description,
      transactionDate,
      reference,
    } = req.body;

    const existingTransaction =
      await prisma.transaction.findUnique({
        where: {
          id: req.params.id,
        },
      });

    if (!existingTransaction) {
      return res.status(404).json({
        error: "Transaction not found.",
      });
    }

    const transactionAmount =
      amount !== undefined
        ? Number(amount)
        : Number(existingTransaction.amount);

    if (!transactionAmount || transactionAmount <= 0) {
      return res.status(400).json({
        error: "Transaction amount must be greater than 0.",
      });
    }

    const updatedTransaction =
      await prisma.transaction.update({
        where: {
          id: req.params.id,
        },
        data: {
          ...(type !== undefined && {
            type,
          }),

          ...(category !== undefined && {
            category,
          }),

          amount: transactionAmount,

          ...(description !== undefined && {
            description: description?.trim() || null,
          }),

          ...(transactionDate !== undefined && {
            transactionDate: transactionDate
              ? new Date(transactionDate)
              : existingTransaction.transactionDate,
          }),

          ...(reference !== undefined && {
            reference: reference?.trim() || null,
          }),
        },
        include: {
          client: true,
          invoice: true,
        },
      });

    res.json(updatedTransaction);
  } catch (err) {
    console.error("Update transaction error:", err);

    res.status(500).json({
      error: err.message || "Failed to update transaction.",
    });
  }
});


// DELETE TRANSACTION
app.delete("/api/transactions/:id", async (req, res) => {
  try {
    const transaction =
      await prisma.transaction.findUnique({
        where: {
          id: req.params.id,
        },
      });

    if (!transaction) {
      return res.status(404).json({
        error: "Transaction not found.",
      });
    }

    await prisma.transaction.delete({
      where: {
        id: req.params.id,
      },
    });

    res.json({
      message: "Transaction deleted successfully.",
    });
  } catch (err) {
    console.error("Delete transaction error:", err);

    res.status(500).json({
      error: err.message || "Failed to delete transaction.",
    });
  }
});
// =========================================================
// MODULE 14 — SUPPORT TICKETS
// =========================================================

app.use("/api/support-tickets", requireAuth);

// GET ALL SUPPORT TICKETS
app.get("/api/support-tickets", async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        client: true,
      },
    });

    res.json(tickets);
  } catch (err) {
    console.error("Get support tickets error:", err);

    res.status(500).json({
      error: err.message || "Failed to load support tickets.",
    });
  }
});

// CREATE SUPPORT TICKET
app.post("/api/support-tickets", async (req, res) => {
  try {
    const {
      clientId,
      subject,
      description,
      status,
      priority,
      category,
      assignedTo,
    } = req.body;

    if (!subject || !String(subject).trim()) {
      return res.status(400).json({
        error: "Subject is required.",
      });
    }

    if (clientId) {
      const client = await prisma.client.findUnique({
        where: {
          id: clientId,
        },
      });

      if (!client) {
        return res.status(400).json({
          error: "Client not found.",
        });
      }
    }

    const ticketNo = `TKT-${Date.now()}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNo,
        clientId: clientId || null,
        subject: String(subject).trim(),
        description: description?.trim() || null,
        status: status || "open",
        priority: priority || "medium",
        category: category || "general",
        assignedTo: assignedTo?.trim() || null,
      },
      include: {
        client: true,
      },
    });

    res.status(201).json(ticket);
  } catch (err) {
    console.error("Create support ticket error:", err);

    res.status(500).json({
      error: err.message || "Failed to create support ticket.",
    });
  }
});

// GET SINGLE SUPPORT TICKET
app.get("/api/support-tickets/:id", async (req, res) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        client: true,
      },
    });

    if (!ticket) {
      return res.status(404).json({
        error: "Support ticket not found.",
      });
    }

    res.json(ticket);
  } catch (err) {
    console.error("Get support ticket error:", err);

    res.status(500).json({
      error: err.message || "Failed to load support ticket.",
    });
  }
});

// UPDATE SUPPORT TICKET
app.patch("/api/support-tickets/:id", async (req, res) => {
  try {
    const {
      subject,
      description,
      status,
      priority,
      category,
      assignedTo,
    } = req.body;

    const existingTicket =
      await prisma.supportTicket.findUnique({
        where: {
          id: req.params.id,
        },
      });

    if (!existingTicket) {
      return res.status(404).json({
        error: "Support ticket not found.",
      });
    }

    const updatedTicket =
      await prisma.supportTicket.update({
        where: {
          id: req.params.id,
        },
        data: {
          ...(subject !== undefined && {
            subject: String(subject).trim(),
          }),

          ...(description !== undefined && {
            description: description?.trim() || null,
          }),

          ...(status !== undefined && {
            status,
          }),

          ...(priority !== undefined && {
            priority,
          }),

          ...(category !== undefined && {
            category,
          }),

          ...(assignedTo !== undefined && {
            assignedTo: assignedTo?.trim() || null,
          }),
        },
        include: {
          client: true,
        },
      });

    res.json(updatedTicket);
  } catch (err) {
    console.error("Update support ticket error:", err);

    res.status(500).json({
      error: err.message || "Failed to update support ticket.",
    });
  }
});

// DELETE SUPPORT TICKET
app.delete("/api/support-tickets/:id", async (req, res) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!ticket) {
      return res.status(404).json({
        error: "Support ticket not found.",
      });
    }

    await prisma.supportTicket.delete({
      where: {
        id: req.params.id,
      },
    });

    res.json({
      message: "Support ticket deleted successfully.",
    });
  } catch (err) {
    console.error("Delete support ticket error:", err);

    res.status(500).json({
      error: err.message || "Failed to delete support ticket.",
    });
  }
});
// =========================================================
// MODULE 15 — REPORTS
// =========================================================

app.use("/api/reports", requireAuth);

// GET REPORTS
app.get("/api/reports", async (req, res) => {
  try {
    const [
      leads,
      deals,
      projects,
      invoices,
      payments,
      supportTickets,
    ] = await Promise.all([
      prisma.lead.findMany({
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.deal.findMany({
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.project.findMany({
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.invoice.findMany({
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.payment.findMany({
        orderBy: {
          paymentDate: "desc",
        },
      }),

      prisma.supportTicket.findMany({
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    // =====================================================
    // LEADS REPORT
    // =====================================================

    const leadsReport = {
      total: leads.length,

      new: leads.filter(
        (lead) => lead.status === "new"
      ).length,

      contacted: leads.filter(
        (lead) => lead.status === "contacted"
      ).length,

      qualified: leads.filter(
        (lead) => lead.status === "qualified"
      ).length,

      converted: leads.filter(
        (lead) => lead.status === "converted"
      ).length,

      lost: leads.filter(
        (lead) => lead.status === "lost"
      ).length,
    };

    // =====================================================
    // SALES REPORT
    // =====================================================

    const totalSales = deals.reduce(
      (sum, deal) =>
        sum + Number(deal.value || 0),
      0
    );

    const wonDeals = deals.filter(
      (deal) =>
        String(deal.stage || "").toLowerCase() === "won"
    );

    const wonSales = wonDeals.reduce(
      (sum, deal) =>
        sum + Number(deal.value || 0),
      0
    );

    const salesReport = {
      totalDeals: deals.length,
      wonDeals: wonDeals.length,
      totalSales,
      wonSales,
    };

    // =====================================================
    // PROJECT REPORT
    // =====================================================

    const projectsReport = {
      total: projects.length,

      planning: projects.filter(
        (project) => project.status === "planning"
      ).length,

      active: projects.filter(
        (project) =>
          project.status === "active" ||
          project.status === "in_progress"
      ).length,

      completed: projects.filter(
        (project) =>
          project.status === "completed"
      ).length,

      onHold: projects.filter(
        (project) =>
          project.status === "on_hold"
      ).length,
    };

    // =====================================================
    // REVENUE REPORT
    // =====================================================

    const totalInvoiced = invoices.reduce(
      (sum, invoice) =>
        sum + Number(invoice.total || 0),
      0
    );

    const totalReceived = payments.reduce(
      (sum, payment) =>
        sum + Number(payment.amount || 0),
      0
    );

    const totalPending = invoices.reduce(
      (sum, invoice) =>
        sum + Number(invoice.balanceAmount || 0),
      0
    );

    const revenueReport = {
      totalInvoiced,
      totalReceived,
      totalPending,
    };

    // =====================================================
    // SUPPORT REPORT
    // =====================================================

    const supportReport = {
      total: supportTickets.length,

      open: supportTickets.filter(
        (ticket) => ticket.status === "open"
      ).length,

      inProgress: supportTickets.filter(
        (ticket) =>
          ticket.status === "in_progress"
      ).length,

      resolved: supportTickets.filter(
        (ticket) =>
          ticket.status === "resolved"
      ).length,

      closed: supportTickets.filter(
        (ticket) =>
          ticket.status === "closed"
      ).length,
    };

    // =====================================================
    // MONTHLY REVENUE
    // =====================================================

    const monthlyRevenue = [];

    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

      const nextMonth = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        1
      );

      const monthPayments = payments.filter(
        (payment) => {
          const paymentDate = new Date(
            payment.paymentDate
          );

          return (
            paymentDate >= monthDate &&
            paymentDate < nextMonth
          );
        }
      );

      const amount = monthPayments.reduce(
        (sum, payment) =>
          sum + Number(payment.amount || 0),
        0
      );

      monthlyRevenue.push({
        month: monthDate.toLocaleString("en-IN", {
          month: "short",
        }),
        revenue: amount,
      });
    }

    // =====================================================
    // FINAL RESPONSE
    // =====================================================

    res.json({
      sales: salesReport,
      leads: leadsReport,
      projects: projectsReport,
      revenue: revenueReport,
      support: supportReport,
      monthlyRevenue,
    });

  } catch (err) {
    console.error("Reports error:", err);

    res.status(500).json({
      error:
        err.message ||
        "Failed to generate reports.",
    });
  }
});
// =========================================================
// MODULE 15 — SETTINGS / USER PROFILE
// =========================================================

app.patch("/api/users/me", requireAuth, async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        error: "Name is required.",
      });
    }

    if (!email?.trim()) {
      return res.status(400).json({
        error: "Email is required.",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: email.trim(),
      },
    });

    if (
      existingUser &&
      existingUser.id !== req.user.userId
    ) {
      return res.status(409).json({
        error: "An account with this email already exists.",
      });
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: req.user.userId,
      },
      data: {
        name: name.trim(),
        email: email.trim(),
      },
    });

    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    });
  } catch (err) {
    console.error("Update profile error:", err);

    res.status(500).json({
      error: err.message || "Failed to update profile.",
    });
  }
});
// =========================================================
// MODULE 16 — SETTINGS / ROLES
// =========================================================

app.use("/api/roles", requireAuth);

// GET all roles
app.get("/api/roles", async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(roles);
  } catch (err) {
    console.error("Get roles error:", err);
    res.status(500).json({
      error: err.message || "Failed to load roles.",
    });
  }
});

// GET single role
app.get("/api/roles/:id", async (req, res) => {
  try {
    const role = await prisma.role.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!role) {
      return res.status(404).json({
        error: "Role not found.",
      });
    }

    res.json(role);
  } catch (err) {
    console.error("Get role error:", err);
    res.status(500).json({
      error: err.message || "Failed to load role.",
    });
  }
});

// CREATE role
app.post("/api/roles", async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        error: "Role name is required.",
      });
    }

    const existingRole = await prisma.role.findUnique({
      where: {
        name: name.trim(),
      },
    });

    if (existingRole) {
      return res.status(409).json({
        error: "A role with this name already exists.",
      });
    }

    const role = await prisma.role.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    res.status(201).json(role);
  } catch (err) {
    console.error("Create role error:", err);
    res.status(500).json({
      error: err.message || "Failed to create role.",
    });
  }
});

// UPDATE role
app.patch("/api/roles/:id", async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        error: "Role name is required.",
      });
    }

    const existingRole = await prisma.role.findUnique({
      where: {
        name: name.trim(),
      },
    });

    if (
      existingRole &&
      existingRole.id !== req.params.id
    ) {
      return res.status(409).json({
        error: "A role with this name already exists.",
      });
    }

    const role = await prisma.role.update({
      where: {
        id: req.params.id,
      },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    res.json(role);
  } catch (err) {
    console.error("Update role error:", err);

    if (err.code === "P2025") {
      return res.status(404).json({
        error: "Role not found.",
      });
    }

    res.status(500).json({
      error: err.message || "Failed to update role.",
    });
  }
});

// DELETE role
app.delete("/api/roles/:id", async (req, res) => {
  try {
    const role = await prisma.role.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!role) {
      return res.status(404).json({
        error: "Role not found.",
      });
    }

    if (role._count.users > 0) {
      return res.status(400).json({
        error: "Cannot delete a role assigned to users.",
      });
    }

    await prisma.role.delete({
      where: {
        id: req.params.id,
      },
    });

    res.json({
      message: "Role deleted successfully.",
    });
  } catch (err) {
    console.error("Delete role error:", err);
    res.status(500).json({
      error: err.message || "Failed to delete role.",
    });
  }
});
// =========================================================
// MODULE 17 — SETTINGS / PERMISSIONS
// =========================================================

app.use("/api/permissions", requireAuth);

// GET all permissions
app.get("/api/permissions", async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany({
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        _count: {
          select: {
            roles: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(permissions);
  } catch (err) {
    console.error("Get permissions error:", err);

    res.status(500).json({
      error: err.message || "Failed to load permissions.",
    });
  }
});

// GET single permission
app.get("/api/permissions/:id", async (req, res) => {
  try {
    const permission = await prisma.permission.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        _count: {
          select: {
            roles: true,
          },
        },
      },
    });

    if (!permission) {
      return res.status(404).json({
        error: "Permission not found.",
      });
    }

    res.json(permission);
  } catch (err) {
    console.error("Get permission error:", err);

    res.status(500).json({
      error: err.message || "Failed to load permission.",
    });
  }
});

// CREATE permission
app.post("/api/permissions", async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        error: "Permission name is required.",
      });
    }

    const existingPermission =
      await prisma.permission.findUnique({
        where: {
          name: name.trim(),
        },
      });

    if (existingPermission) {
      return res.status(409).json({
        error: "A permission with this name already exists.",
      });
    }

    const permission = await prisma.permission.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    res.status(201).json(permission);
  } catch (err) {
    console.error("Create permission error:", err);

    res.status(500).json({
      error: err.message || "Failed to create permission.",
    });
  }
});

// UPDATE permission
app.patch("/api/permissions/:id", async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        error: "Permission name is required.",
      });
    }

    const existingPermission =
      await prisma.permission.findUnique({
        where: {
          name: name.trim(),
        },
      });

    if (
      existingPermission &&
      existingPermission.id !== req.params.id
    ) {
      return res.status(409).json({
        error: "A permission with this name already exists.",
      });
    }

    const permission = await prisma.permission.update({
      where: {
        id: req.params.id,
      },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    res.json(permission);
  } catch (err) {
    console.error("Update permission error:", err);

    if (err.code === "P2025") {
      return res.status(404).json({
        error: "Permission not found.",
      });
    }

    res.status(500).json({
      error: err.message || "Failed to update permission.",
    });
  }
});

// DELETE permission
app.delete("/api/permissions/:id", async (req, res) => {
  try {
    const permission = await prisma.permission.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        _count: {
          select: {
            roles: true,
          },
        },
      },
    });

    if (!permission) {
      return res.status(404).json({
        error: "Permission not found.",
      });
    }

    if (permission._count.roles > 0) {
      return res.status(400).json({
        error: "Cannot delete a permission assigned to roles.",
      });
    }

    await prisma.permission.delete({
      where: {
        id: req.params.id,
      },
    });

    res.json({
      message: "Permission deleted successfully.",
    });
  } catch (err) {
    console.error("Delete permission error:", err);

    res.status(500).json({
      error: err.message || "Failed to delete permission.",
    });
  }
});
// =========================================================
// MODULE 18 — SETTINGS / USERS
// =========================================================

app.use("/api/users", requireAuth);

// GET ALL USERS
app.get("/api/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        roleId: true,
        departmentId: true,
        createdAt: true,
        roleRef: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(users);
  } catch (err) {
    console.error("Get users error:", err);

    res.status(500).json({
      error: err.message || "Failed to load users.",
    });
  }
});


// GET SINGLE USER
app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.params.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        roleId: true,
        departmentId: true,
        createdAt: true,
        roleRef: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    res.json(user);
  } catch (err) {
    console.error("Get user error:", err);

    res.status(500).json({
      error: err.message || "Failed to load user.",
    });
  }
});


// CREATE USER
app.post("/api/users", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      roleId,
      departmentId,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        error: "Name is required.",
      });
    }

    if (!email?.trim()) {
      return res.status(400).json({
        error: "Email is required.",
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters.",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "An account with this email already exists.",
      });
    }

    // Validate role if provided
    if (roleId) {
      const role = await prisma.role.findUnique({
        where: {
          id: roleId,
        },
      });

      if (!role) {
        return res.status(400).json({
          error: "Selected role does not exist.",
        });
      }
    }

    // Validate department if provided
    if (departmentId) {
      const department = await prisma.department.findUnique({
        where: {
          id: departmentId,
        },
      });

      if (!department) {
        return res.status(400).json({
          error: "Selected department does not exist.",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,

        // Keep existing legacy role field in sync
        role: "member",

        ...(roleId && {
          roleId,
        }),

        ...(departmentId && {
          departmentId,
        }),
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        roleId: true,
        departmentId: true,
        createdAt: true,
        roleRef: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json(user);
  } catch (err) {
    console.error("Create user error:", err);

    res.status(500).json({
      error: err.message || "Failed to create user.",
    });
  }
});


// UPDATE USER
app.patch("/api/users/:id", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      roleId,
      departmentId,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        error: "Name is required.",
      });
    }

    if (!email?.trim()) {
      return res.status(400).json({
        error: "Email is required.",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    const emailOwner = await prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    if (
      emailOwner &&
      emailOwner.id !== req.params.id
    ) {
      return res.status(409).json({
        error: "An account with this email already exists.",
      });
    }

    // Validate role
    if (roleId) {
      const role = await prisma.role.findUnique({
        where: {
          id: roleId,
        },
      });

      if (!role) {
        return res.status(400).json({
          error: "Selected role does not exist.",
        });
      }
    }

    // Validate department
    if (departmentId) {
      const department = await prisma.department.findUnique({
        where: {
          id: departmentId,
        },
      });

      if (!department) {
        return res.status(400).json({
          error: "Selected department does not exist.",
        });
      }
    }

    const updateData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      roleId: roleId || null,
      departmentId: departmentId || null,
    };

    // Password only changes when entered
    if (password && password.trim()) {
      if (password.length < 6) {
        return res.status(400).json({
          error: "Password must be at least 6 characters.",
        });
      }

      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: req.params.id,
      },
      data: updateData,

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        roleId: true,
        departmentId: true,
        createdAt: true,
        roleRef: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json(updatedUser);
  } catch (err) {
    console.error("Update user error:", err);

    if (err.code === "P2025") {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    res.status(500).json({
      error: err.message || "Failed to update user.",
    });
  }
});


// DELETE USER
app.delete("/api/users/:id", async (req, res) => {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({
        error: "You cannot delete your own account.",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    await prisma.user.delete({
      where: {
        id: req.params.id,
      },
    });

    res.json({
      message: "User deleted successfully.",
    });
  } catch (err) {
    console.error("Delete user error:", err);

    res.status(500).json({
      error: err.message || "Failed to delete user.",
    });
  }
});
// =========================================================
// MODULE 19 — SETTINGS / DEPARTMENTS
// =========================================================

app.use("/api/departments", requireAuth);

// GET all departments
app.get("/api/departments", async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(departments);
  } catch (err) {
    console.error("Get departments error:", err);

    res.status(500).json({
      error: err.message || "Failed to load departments.",
    });
  }
});

// GET single department
app.get("/api/departments/:id", async (req, res) => {
  try {
    const department = await prisma.department.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!department) {
      return res.status(404).json({
        error: "Department not found.",
      });
    }

    res.json(department);
  } catch (err) {
    console.error("Get department error:", err);

    res.status(500).json({
      error: err.message || "Failed to load department.",
    });
  }
});

// CREATE department
app.post("/api/departments", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        error: "Department name is required.",
      });
    }

    const existingDepartment = await prisma.department.findUnique({
      where: {
        name: name.trim(),
      },
    });

    if (existingDepartment) {
      return res.status(409).json({
        error: "A department with this name already exists.",
      });
    }

    const department = await prisma.department.create({
      data: {
        name: name.trim(),
      },
    });

    res.status(201).json(department);
  } catch (err) {
    console.error("Create department error:", err);

    res.status(500).json({
      error: err.message || "Failed to create department.",
    });
  }
});

// UPDATE department
app.patch("/api/departments/:id", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        error: "Department name is required.",
      });
    }

    const existingDepartment = await prisma.department.findUnique({
      where: {
        name: name.trim(),
      },
    });

    if (
      existingDepartment &&
      existingDepartment.id !== req.params.id
    ) {
      return res.status(409).json({
        error: "A department with this name already exists.",
      });
    }

    const department = await prisma.department.update({
      where: {
        id: req.params.id,
      },
      data: {
        name: name.trim(),
      },
    });

    res.json(department);
  } catch (err) {
    console.error("Update department error:", err);

    if (err.code === "P2025") {
      return res.status(404).json({
        error: "Department not found.",
      });
    }

    res.status(500).json({
      error: err.message || "Failed to update department.",
    });
  }
});

// DELETE department
app.delete("/api/departments/:id", async (req, res) => {
  try {
    const department = await prisma.department.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!department) {
      return res.status(404).json({
        error: "Department not found.",
      });
    }

    if (department._count.users > 0) {
      return res.status(400).json({
        error: "Cannot delete a department assigned to users.",
      });
    }

    await prisma.department.delete({
      where: {
        id: req.params.id,
      },
    });

    res.json({
      message: "Department deleted successfully.",
    });
  } catch (err) {
    console.error("Delete department error:", err);

    res.status(500).json({
      error: err.message || "Failed to delete department.",
    });
  }
});
// =========================================================
// MODULE 20 — SETTINGS / SERVICES
// =========================================================

app.use("/api/services", requireAuth);

// GET all services
app.get("/api/services", async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(services);
  } catch (err) {
    console.error("Get services error:", err);

    res.status(500).json({
      error: err.message || "Failed to load services.",
    });
  }
});

// GET single service
app.get("/api/services/:id", async (req, res) => {
  try {
    const service = await prisma.service.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!service) {
      return res.status(404).json({
        error: "Service not found.",
      });
    }

    res.json(service);
  } catch (err) {
    console.error("Get service error:", err);

    res.status(500).json({
      error: err.message || "Failed to load service.",
    });
  }
});

// CREATE service
app.post("/api/services", async (req, res) => {
  try {
    const { name, description, category, price } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        error: "Service name is required.",
      });
    }

    const existingService = await prisma.service.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: "insensitive",
        },
      },
    });

    if (existingService) {
      return res.status(409).json({
        error: "A service with this name already exists.",
      });
    }

    const service = await prisma.service.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category: category?.trim() || "general",
        price:
          price === "" || price === undefined || price === null
            ? 0
            : Number(price),
      },
    });

    res.status(201).json(service);
  } catch (err) {
    console.error("Create service error:", err);

    res.status(500).json({
      error: err.message || "Failed to create service.",
    });
  }
});

// UPDATE service
app.patch("/api/services/:id", async (req, res) => {
  try {
    const { name, description, category, price } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        error: "Service name is required.",
      });
    }

    const existingService = await prisma.service.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: "insensitive",
        },
      },
    });

    if (
      existingService &&
      existingService.id !== req.params.id
    ) {
      return res.status(409).json({
        error: "A service with this name already exists.",
      });
    }

    const service = await prisma.service.update({
      where: {
        id: req.params.id,
      },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category: category?.trim() || "general",
        price:
          price === "" || price === undefined || price === null
            ? 0
            : Number(price),
      },
    });

    res.json(service);
  } catch (err) {
    console.error("Update service error:", err);

    if (err.code === "P2025") {
      return res.status(404).json({
        error: "Service not found.",
      });
    }

    res.status(500).json({
      error: err.message || "Failed to update service.",
    });
  }
});

// DELETE service
app.delete("/api/services/:id", async (req, res) => {
  try {
    const service = await prisma.service.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!service) {
      return res.status(404).json({
        error: "Service not found.",
      });
    }

    await prisma.service.delete({
      where: {
        id: req.params.id,
      },
    });

    res.json({
      message: "Service deleted successfully.",
    });
  } catch (err) {
    console.error("Delete service error:", err);

    res.status(500).json({
      error: err.message || "Failed to delete service.",
    });
  }
});
// =========================================================
// MODULE 19 — SETTINGS / NOTIFICATIONS
// =========================================================

app.use("/api/notification-settings", requireAuth);

// GET current user's notification settings
app.get("/api/notification-settings", async (req, res) => {
  try {
    let settings = await prisma.notificationSetting.findUnique({
      where: {
        userId: req.user.userId,
      },
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = await prisma.notificationSetting.create({
        data: {
          userId: req.user.userId,
        },
      });
    }

    res.json(settings);
  } catch (err) {
    console.error("Get notification settings error:", err);

    res.status(500).json({
      error: err.message || "Failed to load notification settings.",
    });
  }
});

// UPDATE current user's notification settings
app.patch("/api/notification-settings", async (req, res) => {
  try {
    const {
      emailNotifications,
      taskNotifications,
      leadNotifications,
      projectNotifications,
      paymentNotifications,
      supportNotifications,
    } = req.body;

    const settings = await prisma.notificationSetting.upsert({
      where: {
        userId: req.user.userId,
      },

      update: {
        emailNotifications:
          Boolean(emailNotifications),

        taskNotifications:
          Boolean(taskNotifications),

        leadNotifications:
          Boolean(leadNotifications),

        projectNotifications:
          Boolean(projectNotifications),

        paymentNotifications:
          Boolean(paymentNotifications),

        supportNotifications:
          Boolean(supportNotifications),
      },

      create: {
        userId: req.user.userId,

        emailNotifications:
          emailNotifications !== undefined
            ? Boolean(emailNotifications)
            : true,

        taskNotifications:
          taskNotifications !== undefined
            ? Boolean(taskNotifications)
            : true,

        leadNotifications:
          leadNotifications !== undefined
            ? Boolean(leadNotifications)
            : true,

        projectNotifications:
          projectNotifications !== undefined
            ? Boolean(projectNotifications)
            : true,

        paymentNotifications:
          paymentNotifications !== undefined
            ? Boolean(paymentNotifications)
            : true,

        supportNotifications:
          supportNotifications !== undefined
            ? Boolean(supportNotifications)
            : true,
      },
    });

    res.json(settings);
  } catch (err) {
    console.error("Update notification settings error:", err);

    res.status(500).json({
      error:
        err.message ||
        "Failed to update notification settings.",
    });
  }
});
// =========================================================
// MODULE 20 — SETTINGS / INTEGRATIONS
// =========================================================

app.use("/api/integrations", requireAuth);

// GET all integrations
app.get("/api/integrations", async (req, res) => {
  try {
    const integrations = await prisma.integration.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    res.json(integrations);
  } catch (err) {
    console.error("Get integrations error:", err);

    res.status(500).json({
      error: err.message || "Failed to load integrations.",
    });
  }
});

// GET single integration
app.get("/api/integrations/:id", async (req, res) => {
  try {
    const integration = await prisma.integration.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!integration) {
      return res.status(404).json({
        error: "Integration not found.",
      });
    }

    res.json(integration);
  } catch (err) {
    console.error("Get integration error:", err);

    res.status(500).json({
      error: err.message || "Failed to load integration.",
    });
  }
});

// CREATE integration
app.post("/api/integrations", async (req, res) => {
  try {
    const {
      name,
      provider,
      description,
      enabled,
      configured,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        error: "Integration name is required.",
      });
    }

    if (!provider?.trim()) {
      return res.status(400).json({
        error: "Provider is required.",
      });
    }

    const existing = await prisma.integration.findUnique({
      where: {
        name: name.trim(),
      },
    });

    if (existing) {
      return res.status(409).json({
        error: "An integration with this name already exists.",
      });
    }

    const integration = await prisma.integration.create({
      data: {
        name: name.trim(),
        provider: provider.trim(),
        description: description?.trim() || null,
        enabled: Boolean(enabled),
        configured: Boolean(configured),
      },
    });

    res.status(201).json(integration);
  } catch (err) {
    console.error("Create integration error:", err);

    res.status(500).json({
      error: err.message || "Failed to create integration.",
    });
  }
});

// UPDATE integration
app.patch("/api/integrations/:id", async (req, res) => {
  try {
    const {
      name,
      provider,
      description,
      enabled,
      configured,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        error: "Integration name is required.",
      });
    }

    const existing = await prisma.integration.findUnique({
      where: {
        name: name.trim(),
      },
    });

    if (
      existing &&
      existing.id !== req.params.id
    ) {
      return res.status(409).json({
        error: "An integration with this name already exists.",
      });
    }

    const integration =
      await prisma.integration.update({
        where: {
          id: req.params.id,
        },
        data: {
          name: name.trim(),
          provider: provider.trim(),
          description: description?.trim() || null,
          enabled: Boolean(enabled),
          configured: Boolean(configured),
        },
      });

    res.json(integration);
  } catch (err) {
    console.error("Update integration error:", err);

    if (err.code === "P2025") {
      return res.status(404).json({
        error: "Integration not found.",
      });
    }

    res.status(500).json({
      error: err.message || "Failed to update integration.",
    });
  }
});

// DELETE integration
app.delete("/api/integrations/:id", async (req, res) => {
  try {
    await prisma.integration.delete({
      where: {
        id: req.params.id,
      },
    });

    res.json({
      message: "Integration deleted successfully.",
    });
  } catch (err) {
    console.error("Delete integration error:", err);

    if (err.code === "P2025") {
      return res.status(404).json({
        error: "Integration not found.",
      });
    }

    res.status(500).json({
      error: err.message || "Failed to delete integration.",
    });
  }
});
// =========================================================
// MODULE 21 — SETTINGS / SECURITY
// =========================================================

app.use("/api/security", requireAuth);

app.patch("/api/security/password", async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        error: "All password fields are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: "New password and confirm password do not match.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: "New password must be at least 8 characters.",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    const passwordMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!passwordMatch) {
      return res.status(400).json({
        error: "Current password is incorrect.",
      });
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    await prisma.user.update({
      where: {
        id: req.user.userId,
      },
      data: {
        password: hashedPassword,
      },
    });

    res.json({
      message: "Password updated successfully.",
    });
  } catch (err) {
    console.error("Change password error:", err);

    res.status(500).json({
      error: err.message || "Failed to update password.",
    });
  }
});
// =========================================================
// MODULE 22 — SETTINGS / AUDIT LOGS
// =========================================================

app.use("/api/audit-logs", requireAuth);

// GET all audit logs
app.get("/api/audit-logs", async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(logs);
  } catch (err) {
    console.error("Get audit logs error:", err);

    res.status(500).json({
      error: err.message || "Failed to load audit logs.",
    });
  }
});

// GET single audit log
app.get("/api/audit-logs/:id", async (req, res) => {
  try {
    const log = await prisma.auditLog.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!log) {
      return res.status(404).json({
        error: "Audit log not found.",
      });
    }

    res.json(log);
  } catch (err) {
    console.error("Get audit log error:", err);

    res.status(500).json({
      error: err.message || "Failed to load audit log.",
    });
  }
});

// CREATE audit log
app.post("/api/audit-logs", async (req, res) => {
  try {
    const {
      action,
      module,
      description,
      ipAddress,
    } = req.body;

    if (!action?.trim()) {
      return res.status(400).json({
        error: "Action is required.",
      });
    }

    if (!module?.trim()) {
      return res.status(400).json({
        error: "Module is required.",
      });
    }

    const log = await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: action.trim(),
        module: module.trim(),
        description: description?.trim() || null,
        ipAddress: ipAddress?.trim() || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(log);
  } catch (err) {
    console.error("Create audit log error:", err);

    res.status(500).json({
      error: err.message || "Failed to create audit log.",
    });
  }
});

// DELETE audit log
app.delete("/api/audit-logs/:id", async (req, res) => {
  try {
    await prisma.auditLog.delete({
      where: {
        id: req.params.id,
      },
    });

    res.json({
      message: "Audit log deleted successfully.",
    });
  } catch (err) {
    console.error("Delete audit log error:", err);

    if (err.code === "P2025") {
      return res.status(404).json({
        error: "Audit log not found.",
      });
    }

    res.status(500).json({
      error: err.message || "Failed to delete audit log.",
    });
  }
});
// =========================================================
// AUDIT LOG HELPER
// =========================================================

async function createAuditLog({
  userId,
  action,
  module,
  description,
  ipAddress,
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        module,
        description: description || null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    console.error("Audit log error:", err);
  }
}
// =========================================================
// SERVER START — KEEP THIS AT THE VERY END
// =========================================================

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});