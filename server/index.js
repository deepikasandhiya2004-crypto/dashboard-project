import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { signToken, requireAuth } from "./auth.js";

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
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
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
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
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
    res.json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    console.error("Me error:", err.message);
    res.status(500).json({
      error: "Unable to connect to the database. Please verify your DATABASE_URL in server/.env.",
    });
  }
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
app.delete("/api/projects/:id", async (req, res) => {
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

    // Leads by status
    const leadsByStatus = {
      new: leads.filter((l) => l.status === "new").length,
      contacted: leads.filter((l) => l.status === "contacted").length,
      qualified: leads.filter((l) => l.status === "qualified").length,
      converted: leads.filter((l) => l.status === "converted").length,
      lost: leads.filter((l) => l.status === "lost").length,
    };

    // Leads by source
    const leadsBySource = {};
    for (const lead of leads) {
      const src = lead.source || "other";
      leadsBySource[src] = (leadsBySource[src] || 0) + 1;
    }

    // Content stats
    const contentStats = {
      total: contents.length,
      published: contents.filter((c) => c.status === "published").length,
      draft: contents.filter((c) => c.status === "draft").length,
      review: contents.filter((c) => c.status === "review").length,
    };

    // Social stats
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

    // Meetings
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

    // Follow-ups
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

    // Deadlines (Tasks)
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

    // Deadlines (Projects)
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

    // Milestones
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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));

