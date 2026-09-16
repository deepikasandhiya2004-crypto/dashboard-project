import { useEffect, useState, useCallback } from "react";
import {
  Megaphone,
  Users,
  FileText,
  Share2,
  BarChart3,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { api } from "../lib/api.js";

const campaignStatuses = ["planning", "active", "completed", "paused"];
const leadStatuses = ["new", "contacted", "qualified", "converted", "lost"];
const leadSources = ["website", "referral", "social", "ad", "email"];
const contentTypes = ["blog", "video", "social", "email", "case_study"];
const contentStatuses = ["draft", "review", "published"];
const socialPlatforms = ["linkedin", "twitter", "instagram", "facebook"];
const socialStatuses = ["draft", "scheduled", "published"];

const statusBadge = {
  planning: "bg-purple/10 text-purple border-purple/20",
  active: "bg-brand/10 text-emerald-700 border-brand/20",
  completed: "bg-dark/10 text-dark border-dark/20",
  paused: "bg-orange/10 text-orange border-orange/20",
  new: "bg-blue-50 text-blue-700",
  contacted: "bg-purple/10 text-purple",
  qualified: "bg-brand/10 text-emerald-700",
  converted: "bg-emerald-100 text-emerald-800 font-bold",
  lost: "bg-red-50 text-red-600",
  published: "bg-brand/10 text-emerald-700",
  scheduled: "bg-purple/10 text-purple",
  draft: "bg-gray-100 text-gray-700",
  review: "bg-orange/10 text-orange",
};

const CHART_COLORS = ["#7C3AED", "#00DC46", "#FF6A3D", "#00373A", "#5BA8EF"];

export default function Marketing() {
  const [activeTab, setActiveTab] = useState("campaigns");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Data states
  const [campaigns, setCampaigns] = useState([]);
  const [leads, setLeads] = useState([]);
  const [content, setContent] = useState([]);
  const [socialPosts, setSocialPosts] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Modals
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ name: "", status: "planning", startDate: "", endDate: "", budget: "" });
  const [editingCampaign, setEditingCampaign] = useState(null);

  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: "", email: "", source: "website", status: "new", campaignId: "" });
  const [editingLead, setEditingLead] = useState(null);

  const [showContentModal, setShowContentModal] = useState(false);
  const [contentForm, setContentForm] = useState({ title: "", type: "blog", status: "draft", publishDate: "", author: "" });
  const [editingContent, setEditingContent] = useState(null);

  const [showSocialModal, setShowSocialModal] = useState(false);
  const [socialForm, setSocialForm] = useState({ platform: "linkedin", content: "", status: "draft", scheduledDate: "" });
  const [editingSocial, setEditingSocial] = useState(null);

  const loadAll = useCallback(() => {
    setLoading(true);
    setError("");
    Promise.all([
      api.getCampaigns(),
      api.getMarketingLeads(),
      api.getMarketingContent(),
      api.getSocialPosts(),
      api.getMarketingAnalytics(),
    ])
      .then(([c, l, ct, s, a]) => {
        setCampaigns(c || []);
        setLeads(l || []);
        setContent(ct || []);
        setSocialPosts(s || []);
        setAnalytics(a || null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Campaign Actions
  async function handleSaveCampaign(e) {
    e.preventDefault();
    if (!campaignForm.name.trim()) return;
    try {
      if (editingCampaign) {
        await api.updateCampaign(editingCampaign.id, campaignForm);
      } else {
        await api.createCampaign(campaignForm);
      }
      setShowCampaignModal(false);
      setEditingCampaign(null);
      setCampaignForm({ name: "", status: "planning", startDate: "", endDate: "", budget: "" });
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteCampaign(id, name) {
    if (!window.confirm(`Delete campaign "${name}"?`)) return;
    try {
      await api.deleteCampaign(id);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  // Lead Actions
  async function handleSaveLead(e) {
    e.preventDefault();
    if (!leadForm.name.trim()) return;
    try {
      if (editingLead) {
        await api.updateMarketingLead(editingLead.id, leadForm);
      } else {
        await api.createMarketingLead(leadForm);
      }
      setShowLeadModal(false);
      setEditingLead(null);
      setLeadForm({ name: "", email: "", source: "website", status: "new", campaignId: "" });
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteLead(id, name) {
    if (!window.confirm(`Delete marketing lead "${name}"?`)) return;
    try {
      await api.deleteMarketingLead(id);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  // Content Actions
  async function handleSaveContent(e) {
    e.preventDefault();
    if (!contentForm.title.trim()) return;
    try {
      if (editingContent) {
        await api.updateMarketingContent(editingContent.id, contentForm);
      } else {
        await api.createMarketingContent(contentForm);
      }
      setShowContentModal(false);
      setEditingContent(null);
      setContentForm({ title: "", type: "blog", status: "draft", publishDate: "", author: "" });
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteContent(id, title) {
    if (!window.confirm(`Delete content item "${title}"?`)) return;
    try {
      await api.deleteMarketingContent(id);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  // Social Actions
  async function handleSaveSocial(e) {
    e.preventDefault();
    if (!socialForm.content.trim()) return;
    try {
      if (editingSocial) {
        await api.updateSocialPost(editingSocial.id, socialForm);
      } else {
        await api.createSocialPost(socialForm);
      }
      setShowSocialModal(false);
      setEditingSocial(null);
      setSocialForm({ platform: "linkedin", content: "", status: "draft", scheduledDate: "" });
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteSocial(id) {
    if (!window.confirm("Delete this social post?")) return;
    try {
      await api.deleteSocialPost(id);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  const tabs = [
    { id: "campaigns", label: "Campaigns", count: campaigns.length, icon: Megaphone },
    { id: "leads", label: "Marketing Leads", count: leads.length, icon: Users },
    { id: "content", label: "Content", count: content.length, icon: FileText },
    { id: "social", label: "Social Media", count: socialPosts.length, icon: Share2 },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  // Chart data from real analytics
  const leadsStatusChartData = analytics?.leadsByStatus
    ? Object.entries(analytics.leadsByStatus).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        count,
      }))
    : [];

  const leadsSourceChartData = analytics?.leadsBySource
    ? Object.entries(analytics.leadsBySource).map(([source, value]) => ({
        name: source.charAt(0).toUpperCase() + source.slice(1),
        value,
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-dark tracking-tight">Marketing</h1>
          <p className="mt-1 text-sm text-dark/60">
            Manage multi-channel campaigns, lead capture pipelines, editorial content, and social media.
          </p>
        </div>

        {activeTab === "campaigns" && (
          <button
            onClick={() => {
              setEditingCampaign(null);
              setCampaignForm({ name: "", status: "planning", startDate: "", endDate: "", budget: "" });
              setShowCampaignModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-xs font-bold text-dark hover:brightness-95 active:scale-95"
          >
            <Plus size={16} /> New Campaign
          </button>
        )}
        {activeTab === "leads" && (
          <button
            onClick={() => {
              setEditingLead(null);
              setLeadForm({ name: "", email: "", source: "website", status: "new", campaignId: "" });
              setShowLeadModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-xs font-bold text-dark hover:brightness-95 active:scale-95"
          >
            <Plus size={16} /> New Lead
          </button>
        )}
        {activeTab === "content" && (
          <button
            onClick={() => {
              setEditingContent(null);
              setContentForm({ title: "", type: "blog", status: "draft", publishDate: "", author: "" });
              setShowContentModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-xs font-bold text-dark hover:brightness-95 active:scale-95"
          >
            <Plus size={16} /> New Content
          </button>
        )}
        {activeTab === "social" && (
          <button
            onClick={() => {
              setEditingSocial(null);
              setSocialForm({ platform: "linkedin", content: "", status: "draft", scheduledDate: "" });
              setShowSocialModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-xs font-bold text-dark hover:brightness-95 active:scale-95"
          >
            <Plus size={16} /> New Social Post
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-dark/10 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                isActive ? "border-dark text-dark" : "border-transparent text-dark/50 hover:text-dark"
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${isActive ? "bg-dark text-white" : "bg-dark/10 text-dark/70"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div>
        {/* ================= 1. CAMPAIGNS ================= */}
        {activeTab === "campaigns" && (
          <div className="space-y-4">
            {campaigns.length === 0 && !loading ? (
              <div className="rounded-2xl border border-dashed border-dark/20 bg-white p-12 text-center text-dark/50">
                <Megaphone size={36} className="mx-auto text-dark/30 mb-2" />
                <h3 className="font-bold text-dark">No marketing campaigns</h3>
                <p className="text-xs text-dark/50 mt-1">Create your first campaign to allocate budget and track leads.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-dark/10 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-dark/10 text-xs font-semibold text-dark/50 bg-cream/20">
                      <th className="px-5 py-3.5">CAMPAIGN</th>
                      <th className="px-5 py-3.5">STATUS</th>
                      <th className="px-5 py-3.5">BUDGET</th>
                      <th className="px-5 py-3.5">TIMELINE</th>
                      <th className="px-5 py-3.5">LEADS</th>
                      <th className="px-5 py-3.5 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => (
                      <tr key={c.id} className="border-b border-dark/5 last:border-none hover:bg-dark/5">
                        <td className="px-5 py-4 font-bold text-dark">{c.name}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadge[c.status] || statusBadge.planning}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold text-dark">
                          ${Number(c.budget || 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-xs text-dark/60">
                          {c.startDate ? new Date(c.startDate).toLocaleDateString() : "—"} to{" "}
                          {c.endDate ? new Date(c.endDate).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-5 py-4 text-xs font-medium text-dark/80">
                          {c._count?.leads || 0} leads
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingCampaign(c);
                                setCampaignForm({
                                  name: c.name,
                                  status: c.status,
                                  startDate: c.startDate ? c.startDate.split("T")[0] : "",
                                  endDate: c.endDate ? c.endDate.split("T")[0] : "",
                                  budget: c.budget || "",
                                });
                                setShowCampaignModal(true);
                              }}
                              className="p-1 text-dark/40 hover:text-dark"
                              title="Edit"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteCampaign(c.id, c.name)}
                              className="p-1 text-dark/40 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= 2. MARKETING LEADS ================= */}
        {activeTab === "leads" && (
          <div className="space-y-4">
            {leads.length === 0 && !loading ? (
              <div className="rounded-2xl border border-dashed border-dark/20 bg-white p-12 text-center text-dark/50">
                <Users size={36} className="mx-auto text-dark/30 mb-2" />
                <h3 className="font-bold text-dark">No marketing leads</h3>
                <p className="text-xs text-dark/50 mt-1">Capture leads from website, ads, or inbound inquiries.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-dark/10 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-dark/10 text-xs font-semibold text-dark/50 bg-cream/20">
                      <th className="px-5 py-3.5">LEAD NAME</th>
                      <th className="px-5 py-3.5">EMAIL</th>
                      <th className="px-5 py-3.5">SOURCE</th>
                      <th className="px-5 py-3.5">STATUS</th>
                      <th className="px-5 py-3.5">CAMPAIGN</th>
                      <th className="px-5 py-3.5 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((l) => (
                      <tr key={l.id} className="border-b border-dark/5 last:border-none hover:bg-dark/5">
                        <td className="px-5 py-4 font-bold text-dark">{l.name}</td>
                        <td className="px-5 py-4 text-xs text-dark/70">{l.email || "—"}</td>
                        <td className="px-5 py-4 text-xs capitalize font-medium text-dark/60">{l.source}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadge[l.status] || statusBadge.new}`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-purple font-medium">
                          {l.campaign?.name || "Organic / Direct"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingLead(l);
                                setLeadForm({
                                  name: l.name,
                                  email: l.email || "",
                                  source: l.source,
                                  status: l.status,
                                  campaignId: l.campaignId || "",
                                });
                                setShowLeadModal(true);
                              }}
                              className="p-1 text-dark/40 hover:text-dark"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteLead(l.id, l.name)}
                              className="p-1 text-dark/40 hover:text-red-600"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= 3. CONTENT ================= */}
        {activeTab === "content" && (
          <div className="space-y-4">
            {content.length === 0 && !loading ? (
              <div className="rounded-2xl border border-dashed border-dark/20 bg-white p-12 text-center text-dark/50">
                <FileText size={36} className="mx-auto text-dark/30 mb-2" />
                <h3 className="font-bold text-dark">No content items</h3>
                <p className="text-xs text-dark/50 mt-1">Add blogs, case studies, or newsletter drafts to manage editorial workflow.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-dark/10 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-dark/10 text-xs font-semibold text-dark/50 bg-cream/20">
                      <th className="px-5 py-3.5">CONTENT TITLE</th>
                      <th className="px-5 py-3.5">TYPE</th>
                      <th className="px-5 py-3.5">STATUS</th>
                      <th className="px-5 py-3.5">PUBLISH DATE</th>
                      <th className="px-5 py-3.5">AUTHOR</th>
                      <th className="px-5 py-3.5 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content.map((item) => (
                      <tr key={item.id} className="border-b border-dark/5 last:border-none hover:bg-dark/5">
                        <td className="px-5 py-4 font-bold text-dark">{item.title}</td>
                        <td className="px-5 py-4 text-xs font-medium uppercase text-dark/60">{item.type}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadge[item.status] || statusBadge.draft}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-dark/60">
                          {item.publishDate ? new Date(item.publishDate).toLocaleDateString() : "Draft / Unscheduled"}
                        </td>
                        <td className="px-5 py-4 text-xs text-dark/70">{item.author || "Team"}</td>
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingContent(item);
                                setContentForm({
                                  title: item.title,
                                  type: item.type,
                                  status: item.status,
                                  publishDate: item.publishDate ? item.publishDate.split("T")[0] : "",
                                  author: item.author || "",
                                });
                                setShowContentModal(true);
                              }}
                              className="p-1 text-dark/40 hover:text-dark"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteContent(item.id, item.title)}
                              className="p-1 text-dark/40 hover:text-red-600"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= 4. SOCIAL MEDIA ================= */}
        {activeTab === "social" && (
          <div className="space-y-4">
            {socialPosts.length === 0 && !loading ? (
              <div className="rounded-2xl border border-dashed border-dark/20 bg-white p-12 text-center text-dark/50">
                <Share2 size={36} className="mx-auto text-dark/30 mb-2" />
                <h3 className="font-bold text-dark">No scheduled posts</h3>
                <p className="text-xs text-dark/50 mt-1">Schedule social announcements across LinkedIn, Twitter, and Facebook.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {socialPosts.map((post) => (
                  <div key={post.id} className="rounded-xl border border-dark/10 bg-white p-5 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-dark/5 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-dark">
                        {post.platform}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadge[post.status] || statusBadge.draft}`}>
                        {post.status}
                      </span>
                    </div>

                    <p className="text-sm text-dark font-medium leading-relaxed">{post.content}</p>

                    <div className="flex items-center justify-between border-t border-dark/5 pt-3 text-xs text-dark/50">
                      <span>
                        {post.scheduledDate
                          ? `Scheduled: ${new Date(post.scheduledDate).toLocaleDateString()}`
                          : "Draft"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingSocial(post);
                            setSocialForm({
                              platform: post.platform,
                              content: post.content,
                              status: post.status,
                              scheduledDate: post.scheduledDate ? post.scheduledDate.split("T")[0] : "",
                            });
                            setShowSocialModal(true);
                          }}
                          className="p-1 text-dark/40 hover:text-dark"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteSocial(post.id)}
                          className="p-1 text-dark/40 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= 5. REAL DATABASE ANALYTICS ================= */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="rounded-2xl border border-dark/10 bg-white p-5 shadow-sm">
                <span className="text-xs font-semibold text-dark/50">Active Campaigns</span>
                <div className="mt-2 text-2xl font-black text-dark">
                  {analytics?.activeCampaigns || 0}
                  <span className="text-xs font-medium text-dark/40 ml-2">of {analytics?.totalCampaigns || 0}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-dark/10 bg-white p-5 shadow-sm">
                <span className="text-xs font-semibold text-dark/50">Total Budget</span>
                <div className="mt-2 text-2xl font-black text-dark">
                  ${Number(analytics?.totalBudget || 0).toLocaleString()}
                </div>
              </div>

              <div className="rounded-2xl border border-dark/10 bg-white p-5 shadow-sm">
                <span className="text-xs font-semibold text-dark/50">Total Inbound Leads</span>
                <div className="mt-2 text-2xl font-black text-brand">
                  {analytics?.totalLeads || 0}
                </div>
              </div>

              <div className="rounded-2xl border border-dark/10 bg-white p-5 shadow-sm">
                <span className="text-xs font-semibold text-dark/50">Published Content</span>
                <div className="mt-2 text-2xl font-black text-purple">
                  {analytics?.contentStats?.published || 0}
                  <span className="text-xs font-medium text-dark/40 ml-2">pieces</span>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Lead Pipeline Stages */}
              <div className="rounded-2xl border border-dark/10 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-dark mb-4">Leads by Status Stage</h3>
                {leadsStatusChartData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-xs text-dark/40">
                    No lead data recorded yet.
                  </div>
                ) : (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={leadsStatusChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00373A" strokeOpacity={0.08} />
                        <XAxis dataKey="name" fontSize={11} stroke="#00373A" opacity={0.6} tickLine={false} />
                        <YAxis allowDecimals={false} fontSize={11} stroke="#00373A" opacity={0.6} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#7C3AED" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Lead Sources Distribution */}
              <div className="rounded-2xl border border-dark/10 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-dark mb-4">Leads by Acquisition Source</h3>
                {leadsSourceChartData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-xs text-dark/40">
                    No lead sources recorded yet.
                  </div>
                ) : (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={leadsSourceChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          innerRadius={45}
                          paddingAngle={3}
                        >
                          {leadsSourceChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= CAMPAIGN MODAL ================= */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-dark">{editingCampaign ? "Edit Campaign" : "New Campaign"}</h3>
            <form onSubmit={handleSaveCampaign} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-dark/70">Campaign Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Growth Sprint"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-dark/70">Status</label>
                  <select
                    value={campaignForm.status}
                    onChange={(e) => setCampaignForm({ ...campaignForm, status: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  >
                    {campaignStatuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-dark/70">Budget ($)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="5000"
                    value={campaignForm.budget}
                    onChange={(e) => setCampaignForm({ ...campaignForm, budget: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-dark/70">Start Date</label>
                  <input
                    type="date"
                    value={campaignForm.startDate}
                    onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-dark/70">End Date</label>
                  <input
                    type="date"
                    value={campaignForm.endDate}
                    onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-dark/10">
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-dark/60 hover:text-dark"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-brand px-6 py-2 text-xs font-bold text-dark hover:brightness-95"
                >
                  Save Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= LEAD MODAL ================= */}
      {showLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-dark">{editingLead ? "Edit Lead" : "New Lead"}</h3>
            <form onSubmit={handleSaveLead} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-dark/70">Lead Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Michael Jordan"
                  value={leadForm.name}
                  onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-dark/70">Email</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={leadForm.email}
                  onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-dark/70">Source</label>
                  <select
                    value={leadForm.source}
                    onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  >
                    {leadSources.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-dark/70">Status</label>
                  <select
                    value={leadForm.status}
                    onChange={(e) => setLeadForm({ ...leadForm, status: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  >
                    {leadStatuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-dark/70">Associated Campaign</label>
                <select
                  value={leadForm.campaignId}
                  onChange={(e) => setLeadForm({ ...leadForm, campaignId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                >
                  <option value="">None (Organic / Direct)</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-dark/10">
                <button
                  type="button"
                  onClick={() => setShowLeadModal(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-dark/60 hover:text-dark"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-brand px-6 py-2 text-xs font-bold text-dark hover:brightness-95"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= CONTENT MODAL ================= */}
      {showContentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-dark">{editingContent ? "Edit Content" : "New Content Item"}</h3>
            <form onSubmit={handleSaveContent} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-dark/70">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10 Strategies to Scale Revenue"
                  value={contentForm.title}
                  onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-dark/70">Type</label>
                  <select
                    value={contentForm.type}
                    onChange={(e) => setContentForm({ ...contentForm, type: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  >
                    {contentTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-dark/70">Status</label>
                  <select
                    value={contentForm.status}
                    onChange={(e) => setContentForm({ ...contentForm, status: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  >
                    {contentStatuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-dark/70">Publish Date</label>
                  <input
                    type="date"
                    value={contentForm.publishDate}
                    onChange={(e) => setContentForm({ ...contentForm, publishDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-dark/70">Author</label>
                  <input
                    type="text"
                    placeholder="Author name"
                    value={contentForm.author}
                    onChange={(e) => setContentForm({ ...contentForm, author: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-dark/10">
                <button
                  type="button"
                  onClick={() => setShowContentModal(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-dark/60 hover:text-dark"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-brand px-6 py-2 text-xs font-bold text-dark hover:brightness-95"
                >
                  Save Content
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= SOCIAL POST MODAL ================= */}
      {showSocialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-dark">{editingSocial ? "Edit Social Post" : "New Social Post"}</h3>
            <form onSubmit={handleSaveSocial} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-dark/70">Platform</label>
                <select
                  value={socialForm.platform}
                  onChange={(e) => setSocialForm({ ...socialForm, platform: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                >
                  {socialPlatforms.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-dark/70">Post Content *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Share post updates, product announcements..."
                  value={socialForm.content}
                  onChange={(e) => setSocialForm({ ...socialForm, content: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-dark/70">Status</label>
                  <select
                    value={socialForm.status}
                    onChange={(e) => setSocialForm({ ...socialForm, status: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  >
                    {socialStatuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-dark/70">Scheduled Date</label>
                  <input
                    type="date"
                    value={socialForm.scheduledDate}
                    onChange={(e) => setSocialForm({ ...socialForm, scheduledDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-dark/10">
                <button
                  type="button"
                  onClick={() => setShowSocialModal(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-dark/60 hover:text-dark"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-brand px-6 py-2 text-xs font-bold text-dark hover:brightness-95"
                >
                  Save Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

