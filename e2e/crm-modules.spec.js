import { test, expect } from '@playwright/test';

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

test.describe('INFINIQ CRM — Modules 6, 7, 8, and 9 E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Inject mock auth credentials in localStorage
    await page.addInitScript(() => {
      window.localStorage.setItem('flowline_token', 'mock-jwt-token-xyz');
      window.localStorage.setItem(
        'flowline_user',
        JSON.stringify({
          id: 'user-1',
          name: 'Demo Admin',
          email: 'admin@infiniq.com',
          role: 'admin',
        })
      );
    });

    // Intercept all API calls and handle CORS
    await page.route('**/api/**', async (route) => {
      const req = route.request();
      if (req.method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: corsHeaders });
        return;
      }

      const url = req.url();

      if (url.includes('/api/auth/me')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'user-1',
            name: 'Demo Admin',
            email: 'admin@infiniq.com',
            role: 'admin',
          }),
        });
      } else if (url.includes('/api/projects/proj-1')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'proj-1',
            name: 'Website Redesign',
            client: 'Acme Corp',
            status: 'active',
            progress: 60,
            startDate: '2026-09-01T00:00:00.000Z',
            dueDate: '2026-10-15T00:00:00.000Z',
            milestones: [
              { id: 'm-1', title: 'Phase 1 Delivery', status: 'completed', dueDate: '2026-09-20T00:00:00.000Z' },
            ],
            tasks: [
              { id: 't-1', title: 'Hero Section Layout', status: 'done', priority: 'high', assignee: 'Demo Admin' },
            ],
            team: [
              { id: 'tm-1', name: 'Demo Admin', role: 'Lead Architect' },
            ],
            files: [
              { id: 'f-1', name: 'Design-Tokens.pdf', size: '1.2MB' },
            ],
            feedbacks: [
              { id: 'fb-1', clientName: 'Acme Corp', rating: 5, comment: 'Excellent velocity!' },
            ],
            activities: [
              { id: 'act-1', action: 'Project created', user: 'Demo Admin', createdAt: '2026-09-01T00:00:00.000Z' },
            ],
          }),
        });
      } else if (url.includes('/api/projects')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'proj-1',
              name: 'Website Redesign',
              client: 'Acme Corp',
              status: 'active',
              progress: 60,
              startDate: '2026-09-01T00:00:00.000Z',
              dueDate: '2026-10-15T00:00:00.000Z',
              _count: { tasks: 5, milestones: 3 },
            },
          ]),
        });
      } else if (url.includes('/api/tasks')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 't-1',
              title: 'Audit Navigation Flow',
              assignee: 'Demo Admin',
              priority: 'urgent',
              status: 'todo',
              dueDate: '2026-09-25T00:00:00.000Z',
              projectId: 'proj-1',
              project: { id: 'proj-1', name: 'Website Redesign' },
            },
            {
              id: 't-2',
              title: 'Setup Database Migration',
              assignee: 'Jane Doe',
              priority: 'medium',
              status: 'in_progress',
              dueDate: '2026-09-28T00:00:00.000Z',
              projectId: 'proj-1',
              project: { id: 'proj-1', name: 'Website Redesign' },
            },
          ]),
        });
      } else if (url.includes('/api/marketing/campaigns')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'c-1', name: 'Q4 Product Launch', status: 'active', budget: 15000, _count: { leads: 12 } },
          ]),
        });
      } else if (url.includes('/api/marketing/leads')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'l-1', name: 'Global Tech', email: 'hello@globaltech.com', source: 'website', status: 'qualified' },
          ]),
        });
      } else if (url.includes('/api/marketing/content')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'ct-1', title: 'Modern SaaS Architecture', type: 'blog', status: 'published', author: 'Tech Lead' },
          ]),
        });
      } else if (url.includes('/api/marketing/social')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 's-1', platform: 'linkedin', content: 'Exciting announcement coming soon!', status: 'published' },
          ]),
        });
      } else if (url.includes('/api/marketing/analytics')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            totalCampaigns: 1,
            activeCampaigns: 1,
            totalBudget: 15000,
            totalLeads: 1,
            leadsByStatus: { new: 0, contacted: 0, qualified: 1, converted: 0, lost: 0 },
            leadsBySource: { website: 1 },
            contentStats: { total: 1, published: 1, draft: 0, review: 0 },
            socialStats: { total: 1, scheduled: 0, published: 1 },
          }),
        });
      } else if (url.includes('/api/calendar/events')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'meeting-1',
              rawId: 'm-1',
              type: 'meeting',
              title: 'Sprint Retrospective',
              date: '2026-09-20T00:00:00.000Z',
              startTime: '10:00',
              endTime: '11:00',
              location: 'Google Meet',
              attendees: 'Demo Admin, Jane Doe',
            },
            {
              id: 'followup-1',
              rawId: 'f-1',
              type: 'follow_up',
              title: 'Check Proposal Feedback',
              date: '2026-09-22T00:00:00.000Z',
              client: 'Acme Corp',
              notes: 'Follow up on design tokens contract',
              status: 'pending',
            },
            {
              id: 'task-1',
              rawId: 't-1',
              type: 'deadline',
              title: 'Task Deadline: Audit Navigation Flow',
              date: '2026-09-25T00:00:00.000Z',
              status: 'todo',
              priority: 'urgent',
              projectName: 'Website Redesign',
            },
            {
              id: 'milestone-1',
              rawId: 'ms-1',
              type: 'milestone',
              title: 'Milestone: Phase 1 Delivery',
              date: '2026-09-20T00:00:00.000Z',
              status: 'completed',
              projectName: 'Website Redesign',
            },
          ]),
        });
      } else {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
    });
  });

  test('Module 6: Projects page and Project Details render correctly', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.locator('h1')).toContainText('Project / Delivery');
    await expect(page.getByText('Website Redesign')).toBeVisible();
    await expect(page.getByText('Acme Corp')).toBeVisible();

    // Verify filter buttons
    await expect(page.getByRole('button', { name: 'all' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'active' })).toBeVisible();

    // Navigate to details
    await page.getByText('Website Redesign').click();
    await expect(page).toHaveURL(/.*\/projects\/proj-1/);
    await expect(page.locator('h1')).toContainText('Website Redesign');

    // Verify all 6 tabs exist
    await expect(page.getByRole('button', { name: 'Milestones' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tasks' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Team' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Files' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Client Feedback' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Activity' })).toBeVisible();

    // Switch tabs
    await page.getByRole('button', { name: 'Team' }).click();
    await expect(page.getByText('Lead Architect')).toBeVisible();

    await page.getByRole('button', { name: 'Files' }).click();
    await expect(page.getByText('Design-Tokens.pdf')).toBeVisible();
  });

  test('Module 7: Tasks page with My Tasks and filters renders correctly', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page.locator('h1')).toContainText('Tasks');

    // Check tabs (links)
    await expect(page.getByRole('link', { name: /All Tasks/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /My Tasks/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Team Tasks/i })).toBeVisible();

    // Check tasks listed
    await expect(page.getByText('Audit Navigation Flow')).toBeVisible();
    await expect(page.getByText('Setup Database Migration')).toBeVisible();

    // Switch to My Tasks
    await page.getByRole('link', { name: /My Tasks/i }).click();
    await expect(page.getByText('Audit Navigation Flow')).toBeVisible();

    // Check filter toolbar
    await expect(page.getByPlaceholder(/Search tasks/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /New Task/i })).toBeVisible();
  });

  test('Module 8: Marketing page tabs and analytics render correctly', async ({ page }) => {
    await page.goto('/marketing');
    await expect(page.locator('h1')).toContainText('Marketing');

    // Verify marketing tabs
    await expect(page.getByRole('button', { name: 'Campaigns' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Marketing Leads' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Content' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Social Media' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Analytics' })).toBeVisible();

    // Verify Campaigns view
    await expect(page.getByText('Q4 Product Launch')).toBeVisible();

    // Switch to Marketing Leads tab
    await page.getByRole('button', { name: 'Marketing Leads' }).click();
    await expect(page.getByText('Global Tech')).toBeVisible();

    // Switch to Analytics tab
    await page.getByRole('button', { name: 'Analytics' }).click();
    await expect(page.getByText('Total Budget')).toBeVisible();
    await expect(page.getByText('Active Campaigns')).toBeVisible();
  });

  test('Module 9: Calendar page renders Month & Agenda views and category filters', async ({ page }) => {
    await page.goto('/calendar');
    await expect(page.locator('h1')).toContainText('Calendar & Scheduling');

    // Verify view toggles
    await expect(page.getByRole('button', { name: 'Month', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Agenda', exact: true })).toBeVisible();

    // Verify category filters
    await expect(page.getByRole('button', { name: /All Events/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Meetings/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Follow-ups/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Deadlines/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Milestones/i })).toBeVisible();

    // Verify quick action buttons
    await expect(page.getByRole('button', { name: 'Add Meeting' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Follow-up' })).toBeVisible();

    // Switch to Agenda view
    await page.getByRole('button', { name: 'Agenda', exact: true }).click();
    await expect(page.getByText('Sprint Retrospective')).toBeVisible();
    await expect(page.getByText('Check Proposal Feedback')).toBeVisible();

    // Open Add Meeting modal
    await page.getByRole('button', { name: 'Add Meeting' }).click();
    await expect(page.getByRole('heading', { name: 'Schedule New Meeting' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
  });
});
