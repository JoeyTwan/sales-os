"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, X } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";

interface Customer {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  customer_id: string;
  description: string;
  budget: number;
  status: string;
  created_at: string;
  updated_at: string;
}

const getStatusLabel = (status: string) => {
    switch (status) {
      case "LEAD":
        return "线索阶段";
      case "QUALIFIED":
        return "需求确认";
      case "PROPOSAL":
        return "方案设计";
      case "VERIFICATION":
        return "技术验证";
      case "NEGOTIATION":
        return "商务谈判";
      case "WON":
        return "已成交";
      case "LOST":
        return "售后维护";
      default:
        return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "LEAD":
        return "bg-blue-500/10 text-blue-600";
      case "QUALIFIED":
        return "bg-green-500/10 text-green-600";
      case "PROPOSAL":
        return "bg-purple-500/10 text-purple-600";
      case "VERIFICATION":
        return "bg-cyan-500/10 text-cyan-600";
      case "NEGOTIATION":
        return "bg-orange-500/10 text-orange-600";
      case "WON":
        return "bg-emerald-500/10 text-emerald-600";
      case "LOST":
        return "bg-indigo-500/10 text-indigo-600";
      default:
        return "bg-muted/50 text-muted-foreground";
    }
  };

const formatBudget = (budget: number) => {
  if (!budget) return "-";
  if (budget >= 10000) {
    return `${(budget / 10000).toFixed(1)}万`;
  }
  return budget.toLocaleString();
};

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const [newProject, setNewProject] = useState({
    name: "",
    customer_id: "",
    status: "LEAD" as Project["status"],
    budget: "",
    description: "",
  });
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");

  useEffect(() => {
    loadProjects();
    loadCustomers();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await apiGet<Project[]>("/api/projects");
      setProjects(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await apiGet<Customer[]>("/api/customers");
      setCustomers(data);
    } catch {}
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer?.name || "-";
  };

  const filteredProjects = projects.filter((project) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const projectName = project.name.toLowerCase();
    const customerName = getCustomerName(project.customer_id).toLowerCase();
    return projectName.includes(query) || customerName.includes(query);
  });

  const stats = {
    all: projects.length,
    inProgress: projects.filter((p) => ["LEAD", "QUALIFIED", "PROPOSAL", "VERIFICATION", "NEGOTIATION"].includes(p.status)).length,
    won: projects.filter((p) => p.status === "WON").length,
    paused: projects.filter((p) => p.status === "LOST").length,
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim() || !newProject.customer_id) return;
    setCreating(true);
    setError("");
    try {
      await apiPost("/api/projects", {
        ...newProject,
        budget: newProject.budget ? parseInt(newProject.budget) : null,
      });
      setShowModal(false);
      setCustomerSearchQuery("");
      setNewProject({
        name: "",
        customer_id: "",
        status: "LEAD",
        budget: "",
        description: "",
      });
      loadProjects();
    } catch (err) {
      setError("创建项目失败，请稍后重试");
      console.error("Create project error:", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto px-6 md:px-8 lg:px-12 max-w-[1400px]">
      <div className="mt-8 mb-8">
        <h1 className="text-2xl font-semibold mb-2">项目中心</h1>
        <p className="text-sm text-muted-foreground">管理所有客户项目</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-muted/30 rounded-xl p-4 flex flex-col items-center justify-center">
          <p className="text-4xl font-bold">{stats.all}</p>
          <p className="text-xs text-muted-foreground mt-2">全部项目</p>
        </div>
        <div className="bg-muted/30 rounded-xl p-4 flex flex-col items-center justify-center">
          <p className="text-4xl font-bold text-primary">{stats.inProgress}</p>
          <p className="text-xs text-muted-foreground mt-2">进行中</p>
        </div>
        <div className="bg-muted/30 rounded-xl p-4 flex flex-col items-center justify-center">
          <p className="text-4xl font-bold text-emerald-600">{stats.won}</p>
          <p className="text-xs text-muted-foreground mt-2">已成交</p>
        </div>
        <div className="bg-muted/30 rounded-xl p-4 flex flex-col items-center justify-center">
          <p className="text-4xl font-bold text-gray-600">{stats.paused}</p>
          <p className="text-xs text-muted-foreground mt-2">暂停</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-zinc-800 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="搜索项目名称或客户名称..."
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="ml-4 flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium transition-all hover:bg-primary/90 shadow-md hover:shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>新建项目</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-card rounded-xl shadow-sm p-12 text-center">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-card rounded-xl shadow-sm p-12 text-center">
          <p className="text-muted-foreground">暂无项目</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            新建项目
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-card rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold">{project.name}</h3>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusClass(project.status)}`}
                    >
                      {getStatusLabel(project.status)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">所属客户</p>
                      <p className="font-medium">{getCustomerName(project.customer_id)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">预计金额</p>
                      <p className="font-medium text-amber-600">{formatBudget(project.budget)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">下次动作</p>
                      <p className="font-medium">-</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">更新时间</p>
                      <p className="font-medium">{formatDate(project.updated_at)}</p>
                    </div>
                  </div>
                  {project.description && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold">新建项目</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="px-4 py-3 bg-red-500/10 text-red-600 rounded-xl text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-medium">项目名称 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="输入项目名称"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-medium">所属客户 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    className="w-full px-11 py-3 bg-zinc-800 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="搜索客户名称..."
                  />
                </div>
                <select
                  value={newProject.customer_id}
                  onChange={(e) => setNewProject({ ...newProject, customer_id: e.target.value })}
                  className="w-full px-4 py-3 mt-2 bg-zinc-800 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="">请选择客户</option>
                  {customers
                    .filter((c) =>
                      c.name.toLowerCase().includes(customerSearchQuery.toLowerCase())
                    )
                    .map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-medium">项目阶段 <span className="text-red-500">*</span></label>
                <select
                  value={newProject.status}
                  onChange={(e) => setNewProject({ ...newProject, status: e.target.value as Project["status"] })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="LEAD">线索阶段</option>
                  <option value="QUALIFIED">需求确认</option>
                  <option value="PROPOSAL">方案设计</option>
                  <option value="VERIFICATION">技术验证</option>
                  <option value="NEGOTIATION">商务谈判</option>
                  <option value="WON">已成交</option>
                  <option value="LOST">售后维护</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-medium">预计金额</label>
                <input
                  type="number"
                  value={newProject.budget}
                  onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-medium">备注</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all h-20 resize-none"
                  placeholder="输入备注信息"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-border">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProject.name.trim() || !newProject.customer_id || creating}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {creating ? "创建中..." : "创建项目"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}