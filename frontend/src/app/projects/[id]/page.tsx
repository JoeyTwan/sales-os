"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit2, Trash2, Users, Plus, X, Calendar, AlertCircle, Clock, Brain, Zap, Target, Phone, Mail, Building2, ChevronRight, AlertTriangle, Check, MessageSquare } from "lucide-react";
import { apiGet, apiPost, apiDelete, apiPatch } from "@/lib/api";

interface ProjectOverview {
  project: {
    id: string;
    name: string;
    description: string;
    customer_id: string;
    customer_name: string;
    status: string;
    amount: number;
    created_at: string;
    updated_at: string;
    next_action?: string;
    next_action_date?: string;
  };
  customer: {
    id: string;
    name: string;
    level: string;
    status: string;
  };
  contacts: ProjectContact[];
  tasks: Task[];
  activities: Activity[];
  statistics: {
    contact_count: number;
    task_count: number;
    activity_count: number;
  };
}

interface ProjectContact {
  id: string;
  contact_id: string;
  name: string;
  position: string | null;
  phone: string | null;
  email: string | null;
  role: string | null;
  remark: string | null;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
}

interface Activity {
  id: string;
  content: string;
  source: string;
  activity_date: string;
}

interface CustomerContact {
  id: string;
  name: string;
  position: string | null;
  phone: string | null;
  email: string | null;
  remark: string | null;
}

const STATUS_FLOW = [
  { key: "LEAD", label: "线索阶段" },
  { key: "NEEDS_CONFIRMATION", label: "需求确认" },
  { key: "SOLUTION_DESIGN", label: "方案设计" },
  { key: "TECH_VALIDATION", label: "技术验证" },
  { key: "BUSINESS_NEGOTIATION", label: "商务谈判" },
  { key: "WON", label: "已成交" },
];

const getStatusLabel = (status: string) => {
  const found = STATUS_FLOW.find((s) => s.key === status);
  if (found) return found.label;
  switch (status) {
    case "AFTER_SALE":
      return "售后维护";
    case "LOST":
      return "已流失";
    default:
      return status;
  }
};

const getStatusClass = (status: string) => {
  switch (status) {
    case "LEAD":
      return "bg-blue-500/10 text-blue-600";
    case "NEEDS_CONFIRMATION":
      return "bg-green-500/10 text-green-600";
    case "SOLUTION_DESIGN":
      return "bg-purple-500/10 text-purple-600";
    case "TECH_VALIDATION":
      return "bg-cyan-500/10 text-cyan-600";
    case "BUSINESS_NEGOTIATION":
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

const getCustomerStatusLabel = (status: string) => {
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

const formatAmount = (amount: number | undefined) => {
  if (!amount) return "-";
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(1)}万`;
  }
  return amount.toLocaleString();
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

const getNextStatus = (currentStatus: string): { key: string; label: string } | null => {
  const currentIndex = STATUS_FLOW.findIndex((s) => s.key === currentStatus);
  if (currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1) {
    return STATUS_FLOW[currentIndex + 1];
  }
  return null;
};

const calculateRiskAlerts = (overview: ProjectOverview) => {
  const alerts: { type: "warning" | "info"; message: string }[] = [];
  
  if (overview.contacts.length === 0) {
    alerts.push({ type: "warning", message: "⚠️ 缺少项目联系人" });
  }
  
  if (overview.project.status === "TECH_VALIDATION") {
    const updatedAt = new Date(overview.project.updated_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 14) {
      alerts.push({ type: "warning", message: "⚠️ 技术验证阶段停留过久" });
    }
  }
  
  if (overview.activities.length === 0) {
    const createdAt = new Date(overview.project.created_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 30) {
      alerts.push({ type: "warning", message: "⚠️ 项目长期无跟进" });
    }
  } else {
    const lastActivityDate = new Date(overview.activities[0].activity_date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 30) {
      alerts.push({ type: "warning", message: "⚠️ 项目超过30天没有活动" });
    }
  }
  
  return alerts;
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [overview, setOverview] = useState<ProjectOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showNextActionModal, setShowNextActionModal] = useState(false);
  const [customerContacts, setCustomerContacts] = useState<CustomerContact[]>([]);
  const [addingContact, setAddingContact] = useState(false);
  const [contactError, setContactError] = useState("");

  const [editProject, setEditProject] = useState({
    name: "",
    description: "",
    status: "LEAD" as string,
    amount: "",
  });

  const [newContact, setNewContact] = useState({
    contact_id: "",
    role: "",
    remark: "",
  });

  const [advanceStatus, setAdvanceStatus] = useState("");
  const [advanceRemark, setAdvanceRemark] = useState("");

  const [nextAction, setNextAction] = useState({
    next_action: "",
    next_action_date: "",
  });

  useEffect(() => {
    loadOverview();
  }, [id]);

  const loadOverview = async () => {
    try {
      const data = await apiGet<ProjectOverview>(`/api/projects/${id}/overview`);
      setOverview(data);
      setEditProject({
        name: data.project.name,
        description: data.project.description || "",
        status: data.project.status,
        amount: data.project.amount?.toString() || "",
      });
      setNextAction({
        next_action: data.project.next_action || "",
        next_action_date: data.project.next_action_date || "",
      });
    } catch (err) {
      console.error("Load overview error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerContacts = async () => {
    if (!overview?.project.customer_id) return;
    try {
      const data = await apiGet<CustomerContact[]>(`/api/customers/${overview.project.customer_id}/contacts`);
      setCustomerContacts(data);
    } catch (err) {
      console.error("Load customer contacts error:", err);
    }
  };

  const handleEditProject = async () => {
    if (!editProject.name.trim()) return;
    try {
      await apiPatch(`/api/projects/${id}`, {
        ...editProject,
        amount: editProject.amount ? parseInt(editProject.amount) : null,
      });
      setShowEditModal(false);
      loadOverview();
    } catch (err) {
      console.error("Edit project error:", err);
    }
  };

  const handleDeleteProject = async () => {
    try {
      await apiDelete(`/api/projects/${id}`);
      router.push("/projects");
    } catch (err) {
      console.error("Delete project error:", err);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.contact_id) return;
    setAddingContact(true);
    setContactError("");
    try {
      await apiPost(`/api/projects/${id}/contacts`, {
        contact_id: newContact.contact_id,
        role: newContact.role || null,
        remark: newContact.remark || null,
      });
      setShowAddContactModal(false);
      setNewContact({ contact_id: "", role: "", remark: "" });
      loadOverview();
    } catch (err: any) {
      setContactError(err.message || "添加联系人失败");
    } finally {
      setAddingContact(false);
    }
  };

  const handleRemoveContact = async (contactId: string) => {
    try {
      await apiDelete(`/api/projects/${id}/contacts/${contactId}`);
      loadOverview();
    } catch (err) {
      console.error("Remove contact error:", err);
    }
  };

  const handleAdvanceStage = async () => {
    if (!advanceStatus) return;
    try {
      await apiPatch(`/api/projects/${id}/status`, {
        status: advanceStatus,
        remark: advanceRemark || null,
      });
      setShowAdvanceModal(false);
      setAdvanceStatus("");
      setAdvanceRemark("");
      loadOverview();
    } catch (err) {
      console.error("Advance stage error:", err);
    }
  };

  const handleUpdateNextAction = async () => {
    try {
      await apiPatch(`/api/projects/${id}/next-action`, {
        next_action: nextAction.next_action || null,
        next_action_date: nextAction.next_action_date || null,
      });
      setShowNextActionModal(false);
      loadOverview();
    } catch (err) {
      console.error("Update next action error:", err);
    }
  };

  const availableContacts = customerContacts.filter(
    (c) => !overview?.contacts.some((pc) => pc.contact_id === c.id)
  );

  const currentStatusIndex = overview ? STATUS_FLOW.findIndex((s) => s.key === overview.project.status) : -1;
  const nextStatus = overview ? getNextStatus(overview.project.status) : null;
  const riskAlerts = overview ? calculateRiskAlerts(overview) : [];

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
        <p className="text-muted-foreground">项目不存在</p>
      </div>
    );
  }

  const { project, customer, contacts, tasks, activities } = overview;

  return (
    <div className="py-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push("/projects")}
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回项目列表</span>
        </button>
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <span className={`ml-auto px-3 py-1 text-xs font-medium rounded-full ${getStatusClass(project.status)}`}>
          {getStatusLabel(project.status)}
        </span>
      </div>

      <div className="bg-card rounded-xl shadow-sm p-6 mb-8 border border-primary/5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm text-muted-foreground">所属客户</span>
              <span className="font-medium">{customer?.name || project.customer_name}</span>
              {customer && (
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getLevelClass(customer.level)}`}>
                  {getLevelLabel(customer.level)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                创建于 {formatDateTime(project.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                金额 {formatAmount(project.amount)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-muted/50 text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              <span>编辑项目</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-600 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>删除项目</span>
            </button>
          </div>
        </div>
      </div>

      {riskAlerts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-medium text-amber-700">AI销售提醒</span>
          </div>
          <div className="space-y-2">
            {riskAlerts.map((alert, index) => (
              <p key={index} className="text-sm text-amber-700">{alert.message}</p>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-4">
              <Zap className="w-4 h-4" />
              <span>项目信息</span>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">项目描述</p>
                <p className="text-sm text-foreground/80">{project.description || "-"}</p>
              </div>
              {customer && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">客户信息</p>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm font-medium">{customer.name}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className={`px-2 py-0.5 rounded-full ${getLevelClass(customer.level)}`}>
                        {getLevelLabel(customer.level)}级客户
                      </span>
                      <span className="text-muted-foreground">{getCustomerStatusLabel(customer.status)}</span>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">项目金额</p>
                <p className="text-lg font-semibold text-amber-600">{formatAmount(project.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">项目状态</p>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusClass(project.status)}`}>
                  {getStatusLabel(project.status)}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">更新时间</p>
                <p className="text-sm">{formatDateTime(project.updated_at)}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <MessageSquare className="w-4 h-4" />
                <span>销售下一步</span>
              </div>
              <button
                onClick={() => setShowNextActionModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                <span>编辑</span>
              </button>
            </div>
            {project.next_action ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">下一步动作</p>
                  <p className="text-sm font-medium">{project.next_action}</p>
                </div>
                {project.next_action_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{formatDate(project.next_action_date)}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">暂无下一步动作</p>
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>项目联系人</span>
              </div>
              <button
                onClick={() => {
                  loadCustomerContacts();
                  setShowAddContactModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>添加联系人</span>
              </button>
            </div>
            {contacts.length > 0 ? (
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div key={contact.id} className="p-4 rounded-xl bg-muted/30 relative">
                    <button
                      onClick={() => handleRemoveContact(contact.contact_id)}
                      className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">{contact.position || "-"}</p>
                      </div>
                    </div>
                    {contact.role && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-1">项目角色</p>
                        <p className="text-sm font-medium">{contact.role}</p>
                      </div>
                    )}
                    {contact.remark && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">备注</p>
                        <p className="text-xs text-foreground/80">{contact.remark}</p>
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      {contact.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {contact.phone}
                        </span>
                      )}
                      {contact.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {contact.email}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">暂无项目联系人</p>
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-4">
              <Brain className="w-4 h-4" />
              <span>AI战略分析</span>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-foreground/80">当前：暂无</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">未来接入：</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-blue-500/10 text-blue-600 rounded text-xs">项目风险</span>
                  <span className="px-2 py-1 bg-green-500/10 text-green-600 rounded text-xs">下一步动作</span>
                  <span className="px-2 py-1 bg-purple-500/10 text-purple-600 rounded text-xs">成交概率</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Zap className="w-4 h-4" />
                <span>项目阶段</span>
              </div>
              {nextStatus && project.status !== "WON" && project.status !== "LOST" && (
                <button
                  onClick={() => {
                    setAdvanceStatus(nextStatus.key);
                    setShowAdvanceModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>推进阶段</span>
                </button>
              )}
            </div>
            <div className="flex flex-col">
              {STATUS_FLOW.map((status, index) => {
                const isCompleted = index < currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                const isFuture = index > currentStatusIndex;
                
                return (
                  <div key={status.key} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCompleted ? "bg-green-500 text-white" :
                      isCurrent ? "bg-primary text-primary-foreground" :
                      "bg-muted/50 text-muted-foreground"
                    }`}>
                      {isCompleted ? <Check className="w-4 h-4" /> : (index + 1)}
                    </div>
                    <div className="flex-1">
                      <div className={`h-0.5 ${
                        isCompleted || isCurrent ? "bg-primary" : "bg-muted/50"
                      }`}></div>
                    </div>
                    <span className={`text-sm font-medium ${
                      isCurrent ? "text-primary" :
                      isCompleted ? "text-green-600" :
                      "text-muted-foreground"
                    }`}>
                      {status.label}
                    </span>
                    {isCurrent && (
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusClass(status.key)}`}>
                        当前
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-6">
              <Target className="w-4 h-4" />
              <span>项目任务</span>
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
                        <span>截止日期：{formatDate(task.due_date)}</span>
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
              <span>时间线</span>
            </div>
            {activities.length > 0 ? (
              <div className="relative">
                <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border"></div>
                <div className="space-y-6">
                  {activities.map((activity) => (
                    <div key={activity.id} className="relative">
                      <div className="absolute left-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center z-10">
                        <Clock className="w-4 h-4" />
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
                <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">暂无活动记录</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEditModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEditModal(false);
          }}
        >
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold">编辑项目</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-medium">项目名称 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editProject.name}
                  onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="输入项目名称"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-medium">项目阶段 <span className="text-red-500">*</span></label>
                <select
                  value={editProject.status}
                  onChange={(e) => setEditProject({ ...editProject, status: e.target.value })}
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
                <label className="block text-sm text-muted-foreground mb-2 font-medium">项目金额</label>
                <input
                  type="number"
                  value={editProject.amount}
                  onChange={(e) => setEditProject({ ...editProject, amount: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-medium">项目描述</label>
                <textarea
                  value={editProject.description}
                  onChange={(e) => setEditProject({ ...editProject, description: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all h-20 resize-none"
                  placeholder="输入项目描述"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-border">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleEditProject}
                disabled={!editProject.name.trim()}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDeleteConfirm(false);
          }}
        >
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">确认删除</h2>
              <p className="text-sm text-muted-foreground">删除后无法恢复，确定要删除此项目吗？</p>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-border">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDeleteProject}
                className="px-6 py-2.5 bg-red-500 text-red-foreground rounded-xl text-sm font-medium transition-all hover:bg-red-500/90"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddContactModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddContactModal(false);
          }}
        >
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold">添加项目联系人</h2>
              <button
                onClick={() => setShowAddContactModal(false)}
                className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {contactError && (
                <div className="px-4 py-3 bg-red-500/10 text-red-600 rounded-xl text-sm">
                  {contactError}
                </div>
              )}
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-medium">选择联系人 <span className="text-red-500">*</span></label>
                <select
                  value={newContact.contact_id}
                  onChange={(e) => setNewContact({ ...newContact, contact_id: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="">请选择联系人</option>
                  {availableContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name} {contact.position ? `(${contact.position})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-medium">项目角色</label>
                <input
                  type="text"
                  value={newContact.role}
                  onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="例如：技术负责人"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-medium">备注</label>
                <textarea
                  value={newContact.remark}
                  onChange={(e) => setNewContact({ ...newContact, remark: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all h-20 resize-none"
                  placeholder="输入备注信息"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-border">
              <button
                onClick={() => setShowAddContactModal(false)}
                className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddContact}
                disabled={!newContact.contact_id || addingContact}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingContact ? "添加中..." : "添加联系人"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdvanceModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAdvanceModal(false);
          }}
        >
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold">推进阶段</h2>
              <button
                onClick={() => setShowAdvanceModal(false)}
                className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-medium">下一阶段 <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-2 rounded-lg text-sm font-medium ${getStatusClass(advanceStatus)}`}>
                    {getStatusLabel(advanceStatus)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-medium">备注</label>
                <textarea
                  value={advanceRemark}
                  onChange={(e) => setAdvanceRemark(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all h-24 resize-none"
                  placeholder="输入阶段推进备注（可选）"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-border">
              <button
                onClick={() => setShowAdvanceModal(false)}
                className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAdvanceStage}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium transition-all hover:bg-primary/90"
              >
                确认推进
              </button>
            </div>
          </div>
        </div>
      )}

      {showNextActionModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNextActionModal(false);
          }}
        >
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold">编辑下一步动作</h2>
              <button
                onClick={() => setShowNextActionModal(false)}
                className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-medium">下一步动作</label>
                <input
                  type="text"
                  value={nextAction.next_action}
                  onChange={(e) => setNextAction({ ...nextAction, next_action: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="例如：安排技术交流会议"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-medium">日期</label>
                <input
                  type="date"
                  value={nextAction.next_action_date}
                  onChange={(e) => setNextAction({ ...nextAction, next_action_date: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-border">
              <button
                onClick={() => setShowNextActionModal(false)}
                className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUpdateNextAction}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium transition-all hover:bg-primary/90"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}