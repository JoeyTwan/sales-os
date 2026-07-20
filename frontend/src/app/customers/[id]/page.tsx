"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Folder, FileText, Calendar, Clock, Target, DollarSign, Users, Zap, TrendingUp, AlertTriangle, RefreshCw, Brain, Plus, X, Building2 } from "lucide-react";
import { apiGet, apiPost, CustomerOverview, CustomerOverviewContact, CustomerOverviewProject, CustomerOverviewActivity, CustomerOverviewTask } from "@/lib/api";

const STATUS_FLOW = [
  { key: "LEAD", label: "线索" },
  { key: "NEEDS_CONFIRMATION", label: "需求确认" },
  { key: "SOLUTION_DESIGN", label: "方案" },
  { key: "TECH_VALIDATION", label: "技术验证" },
  { key: "BUSINESS_NEGOTIATION", label: "商务" },
  { key: "WON", label: "成交" },
  { key: "AFTER_SALE", label: "售后" },
];

const getLevelClass = (level: string) => {
  switch (level) {
    case "HIGH":
      return "bg-red-500/10 text-red-600";
    case "MEDIUM":
      return "bg-yellow-500/10 text-yellow-700";
    case "LOW":
      return "bg-muted/50 text-muted-foreground";
    default:
      return "bg-muted/50 text-muted-foreground";
  }
};

const getLevelLabel = (level: string) => {
  switch (level) {
    case "HIGH":
      return "高";
    case "MEDIUM":
      return "中";
    case "LOW":
      return "低";
    default:
      return level;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "跟进中";
    case "FOLLOWING":
      return "重点推进";
    case "PAUSED":
      return "已暂停";
    case "LOST":
      return "已丢失";
    default:
      return status;
  }
};

const getStatusClass = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-500/10 text-green-600";
    case "FOLLOWING":
      return "bg-amber-500/10 text-amber-600";
    case "PAUSED":
      return "bg-yellow-500/10 text-yellow-700";
    case "LOST":
      return "bg-gray-500/10 text-gray-600";
    default:
      return "bg-muted/50 text-muted-foreground";
  }
};

const getProjectStatusLabel = (status: string) => {
  const found = STATUS_FLOW.find((s) => s.key === status);
  if (found) return found.label;
  switch (status) {
    case "QUALIFIED":
      return "需求确认";
    case "PROPOSAL":
      return "方案设计";
    case "VERIFICATION":
      return "技术验证";
    case "NEGOTIATION":
      return "商务谈判";
    case "AFTER_SALE":
      return "售后维护";
    case "LOST":
      return "已流失";
    default:
      return status;
  }
};

const getProjectStatusClass = (status: string) => {
  switch (status) {
    case "LEAD":
    case "QUALIFIED":
      return "bg-blue-500/10 text-blue-600";
    case "NEEDS_CONFIRMATION":
      return "bg-green-500/10 text-green-600";
    case "SOLUTION_DESIGN":
    case "PROPOSAL":
      return "bg-purple-500/10 text-purple-600";
    case "TECH_VALIDATION":
    case "VERIFICATION":
      return "bg-cyan-500/10 text-cyan-600";
    case "BUSINESS_NEGOTIATION":
    case "NEGOTIATION":
      return "bg-orange-500/10 text-orange-600";
    case "WON":
      return "bg-emerald-500/10 text-emerald-600";
    case "AFTER_SALE":
      return "bg-indigo-500/10 text-indigo-600";
    case "LOST":
      return "bg-gray-500/10 text-gray-600";
    default:
      return "bg-muted/50 text-muted-foreground";
  }
};

const getSourceLabel = (source: string) => {
  switch (source) {
    case "capture":
      return "📥 Capture";
    case "manual":
      return "✏️ 手动";
    case "email":
      return "📧 邮件";
    case "phone":
      return "📞 电话";
    case "meeting":
      return "📝 会议纪要";
    default:
      return source;
  }
};

const getTaskStatusLabel = (status: string) => {
  switch (status) {
    case "TODO":
      return "待办";
    case "DOING":
      return "进行中";
    case "DONE":
      return "已完成";
    default:
      return status;
  }
};

const getTaskStatusClass = (status: string) => {
  switch (status) {
    case "TODO":
      return "bg-muted/50 text-muted-foreground";
    case "DOING":
      return "bg-blue-500/10 text-blue-600";
    case "DONE":
      return "bg-green-500/10 text-green-600";
    default:
      return "bg-muted/50 text-muted-foreground";
  }
};

const getTaskPriorityClass = (priority: string) => {
  switch (priority) {
    case "HIGH":
      return "bg-red-500/10 text-red-600";
    case "MEDIUM":
      return "bg-yellow-500/10 text-yellow-700";
    case "LOW":
      return "bg-muted/50 text-muted-foreground";
    default:
      return "bg-muted/50 text-muted-foreground";
  }
};

const getTaskPriorityLabel = (priority: string) => {
  switch (priority) {
    case "HIGH":
      return "高";
    case "MEDIUM":
      return "中";
    case "LOW":
      return "低";
    default:
      return priority;
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "short", day: "numeric" });
};

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const formatAmount = (amount: number | null | undefined) => {
  if (!amount) return "-";
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(1)}万`;
  }
  return amount.toLocaleString();
};

export default function CustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [overview, setOverview] = useState<CustomerOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectError, setProjectError] = useState("");
  const [newProject, setNewProject] = useState({
    name: "",
    customer_id: id as string,
    status: "LEAD" as string,
    amount: "",
    description: "",
  });

  useEffect(() => {
    loadOverview();
  }, [id]);

  const loadOverview = async () => {
    try {
      const data = await apiGet<CustomerOverview>(`/api/customers/${id}/overview`);
      setOverview(data);
    } catch (err) {
      console.error("Load overview error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return;
    setCreatingProject(true);
    setProjectError("");
    try {
      await apiPost("/api/projects", {
        ...newProject,
        amount: newProject.amount ? parseInt(newProject.amount) : null,
      });
      setShowProjectModal(false);
      setNewProject({
        name: "",
        customer_id: id as string,
        status: "LEAD",
        amount: "",
        description: "",
      });
      loadOverview();
    } catch (err) {
      setProjectError("创建项目失败，请稍后重试");
      console.error("Create project error:", err);
    } finally {
      setCreatingProject(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <span className="text-muted-foreground">加载中...</span>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="py-8">
        <p className="text-muted-foreground">客户不存在</p>
      </div>
    );
  }

  const { customer, contacts, projects, tasks, activities, statistics } = overview;

  return (
    <div className="py-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push("/customers")}
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回客户列表</span>
        </button>
        <h1 className="text-2xl font-semibold">{customer.name}</h1>
        <span className={`ml-auto px-3 py-1 text-xs font-medium rounded-full ${getLevelClass(customer.level)}`}>
          {getLevelLabel(customer.level)}级客户
        </span>
      </div>

      <div className="bg-card rounded-xl shadow-sm p-6 mb-8 border border-primary/5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusClass(customer.status)}`}>
              {getStatusLabel(customer.status)}
            </span>
            <span className="text-sm text-muted-foreground">
              <Clock className="w-4 h-4 inline mr-1" />
              更新于 {formatDateTime(customer.updated_at)}
            </span>
          </div>
          <button
            onClick={() => {
              setNewProject({
                name: "",
                customer_id: id as string,
                status: "LEAD",
                amount: "",
                description: "",
              });
              setShowProjectModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>新建项目</span>
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-sm p-6 mb-8">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-4">
          <TrendingUp className="w-4 h-4" />
          <span>项目漏斗</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-2xl font-semibold text-primary">{statistics.project_count}</p>
            <p className="text-xs text-muted-foreground mt-1">全部项目</p>
          </div>
          <div className="flex-1 mx-8 flex items-center justify-between">
            {STATUS_FLOW.map((stage) => {
              const count = statistics.project_stage_count[stage.key] || 0;
              return (
                <div key={stage.key} className="text-center">
                  <p className={`text-lg font-medium ${count > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                    {count}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{stage.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-4">
              <User className="w-4 h-4" />
              <span>客户信息</span>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">状态</p>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusClass(customer.status)}`}>
                  {getStatusLabel(customer.status)}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">摘要</p>
                <p className="text-sm text-foreground/80">{customer.summary || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">下一步动作</p>
                <p className="text-sm text-foreground/80">{customer.next_action || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">下次跟进</p>
                <p className="text-sm text-foreground/80">{formatDate(customer.next_action_date) || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">创建时间</p>
                <p className="text-sm text-foreground/80">{formatDateTime(customer.created_at)}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-4">
              <Users className="w-4 h-4" />
              <span>联系人 ({contacts.length})</span>
            </div>
            {contacts.length > 0 ? (
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div key={contact.id} className="p-3 rounded-xl bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">{contact.position || "-"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">暂无联系人</p>
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-4">
              <Brain className="w-4 h-4" />
              <span>客户战略大脑</span>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-foreground/80">当前：暂无</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Folder className="w-4 h-4" />
                <span>项目列表 ({projects.length})</span>
              </div>
              <button
                onClick={() => {
                  setNewProject({
                    name: "",
                    customer_id: id as string,
                    status: "LEAD",
                    amount: "",
                    description: "",
                  });
                  setShowProjectModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>新建项目</span>
              </button>
            </div>
            {projects.length > 0 ? (
              <div className="space-y-3">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-primary" />
                        <p className="text-sm font-medium">{project.name}</p>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${getProjectStatusClass(project.status)}`}>
                        {getProjectStatusLabel(project.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-600 font-medium">
                        <DollarSign className="w-3 h-3 inline mr-1" />
                        {formatAmount(project.amount)}
                      </span>
                      <span className="text-muted-foreground">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatDate(project.updated_at)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Folder className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">暂无项目</p>
                <button
                  onClick={() => {
                    setNewProject({
                      name: "",
                      customer_id: id as string,
                      status: "LEAD",
                      amount: "",
                      description: "",
                    });
                    setShowProjectModal(true);
                  }}
                  className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  + 新建项目
                </button>
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-6">
              <Target className="w-4 h-4" />
              <span>任务列表 ({tasks.length})</span>
            </div>
            {tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="p-4 rounded-xl bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">{task.title}</p>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTaskStatusClass(task.status)}`}>
                          {getTaskStatusLabel(task.status)}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTaskPriorityClass(task.priority)}`}>
                          {getTaskPriorityLabel(task.priority)}
                        </span>
                      </div>
                    </div>
                    {task.due_date && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(task.due_date)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">暂无任务</p>
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-6">
              <Clock className="w-4 h-4" />
              <span>时间线 ({activities.length})</span>
            </div>

            {activities.length > 0 ? (
              <div className="relative">
                <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border"></div>
                <div className="space-y-6">
                  {activities.map((activity) => (
                    <div key={activity.id} className="relative">
                      <div className="absolute left-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center z-10">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="ml-14 bg-muted/30 rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs text-muted-foreground">{getSourceLabel(activity.source)}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(activity.activity_date)}</span>
                        </div>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap">{activity.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">暂无活动记录</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showProjectModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowProjectModal(false);
          }}
        >
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold">新建项目</h2>
              <button
                onClick={() => setShowProjectModal(false)}
                className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {projectError && (
                <div className="px-4 py-3 bg-red-500/10 text-red-600 rounded-xl text-sm">
                  {projectError}
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
                <label className="block text-sm text-muted-foreground mb-2 font-medium">所属客户</label>
                <input
                  type="text"
                  value={customer.name}
                  disabled
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-border rounded-xl text-muted-foreground"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-medium">项目阶段 <span className="text-red-500">*</span></label>
                <select
                  value={newProject.status}
                  onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="LEAD">线索阶段</option>
                  <option value="NEEDS_CONFIRMATION">需求确认</option>
                  <option value="SOLUTION_DESIGN">方案设计</option>
                  <option value="TECH_VALIDATION">技术验证</option>
                  <option value="BUSINESS_NEGOTIATION">商务谈判</option>
                  <option value="WON">已成交</option>
                  <option value="AFTER_SALE">售后维护</option>
                  <option value="LOST">已流失</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-medium">预计金额</label>
                <input
                  type="number"
                  value={newProject.amount}
                  onChange={(e) => setNewProject({ ...newProject, amount: e.target.value })}
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
                onClick={() => setShowProjectModal(false)}
                className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProject.name.trim() || creatingProject}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingProject ? "创建中..." : "创建项目"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}