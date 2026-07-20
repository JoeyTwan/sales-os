"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, CheckCircle, User, Folder, ListTodo, Calendar, FileText, Plus, MoreHorizontal, Edit2, Trash2, Pin, Sparkles, Target, ClipboardList, Clock } from "lucide-react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";

interface Activity {
  id: string;
  content: string;
  activity_date: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: "TODO" | "DOING" | "DONE";
  priority: "HIGH" | "MEDIUM" | "LOW";
  due_date: string;
  is_pinned?: boolean;
  customer_name?: string;
  project_name?: string;
}

interface CustomerAISummary {
  stage: string;
  budget: string;
  decision_maker: string;
  risk: string;
  next_action: string;
  estimated_close_date: string;
  confidence: number;
  last_activity_summary: string;
}

interface Customer {
  id: string;
  name: string;
  company: string;
  contact: string;
  level: "HIGH" | "MEDIUM" | "LOW";
  status: "ACTIVE" | "FOLLOWING" | "PAUSED" | "LOST";
  summary: string;
  current_requirement: string;
  next_action: string;
  next_action_date: string;
  created_at: string;
  updated_at: string;
  projects?: Project[];
  ai_summary?: CustomerAISummary;
}

interface Project {
  id: string;
  name: string;
  status: string;
}

interface CustomerSuggestion {
  name: string;
  company?: string;
  level: string;
  status: string;
  summary?: string;
}

interface ProjectSuggestion {
  name: string;
  description?: string;
  budget?: number;
  status: string;
}

interface TaskSuggestion {
  title: string;
  description?: string;
  priority: string;
  due_date?: string;
}

interface MatchedCustomer {
  id: string;
  name: string;
  confidence: number;
}

interface AnalyzeResult {
  suggestion_id: string;
  raw_content: string;
  activity_content: string | null;
  matched_customer: MatchedCustomer | null;
  customers: CustomerSuggestion[];
  contacts: any[];
  projects: ProjectSuggestion[];
  tasks: TaskSuggestion[];
}

type InputMode = "ai_assistant" | "customer_project" | "personal_task";

const inputModes: { value: InputMode; label: string }[] = [
  { value: "ai_assistant", label: "AI助手" },
  { value: "customer_project", label: "客户项目" },
  { value: "personal_task", label: "个人任务" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [expandedContent, setExpandedContent] = useState(false);
  const [activeTab, setActiveTab] = useState<"today" | "7days" | "30days" | "all" | "completed">("today");
  const [inputMode, setInputMode] = useState<InputMode>("ai_assistant");
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showTaskMenu, setShowTaskMenu] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editableCustomer, setEditableCustomer] = useState<CustomerSuggestion | null>(null);
  const [editableContact, setEditableContact] = useState<{ name: string; position: string; phone: string } | null>(null);
  const [editableProject, setEditableProject] = useState<ProjectSuggestion | null>(null);
  const [editableTasks, setEditableTasks] = useState<TaskSuggestion[]>([]);
  const [editableActivity, setEditableActivity] = useState("");
  const [activityTime, setActivityTime] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomInputRef = useRef<HTMLDivElement>(null);
  
  const projectStatusOptions = [
    { value: "LEAD", label: "线索" },
    { value: "QUALIFIED", label: "需求确认" },
    { value: "PROPOSAL", label: "方案设计" },
    { value: "VERIFICATION", label: "技术验证" },
    { value: "NEGOTIATION", label: "商务谈判" },
    { value: "WON", label: "成交" },
    { value: "PAUSED", label: "暂停" },
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    textareaRef.current?.focus();
    loadActivities();
    loadTasks();
    loadCustomers();
  }, []);

  const loadActivities = async () => {
    try {
      const data = await apiGet<Activity[]>("/api/activities");
      setActivities(data.slice(0, 10));
    } catch {}
  };

  const loadTasks = async () => {
    try {
      const data = await apiGet<Task[]>("/api/tasks");
      setTasks(data);
    } catch {}
  };

  const loadCustomers = async () => {
    try {
      const data = await apiGet<Customer[]>("/api/customers");
      const activeCustomers = data.filter((c: Customer) => c.status !== "LOST");
      activeCustomers.sort((a: Customer, b: Customer) => {
        const dateA = a.next_action_date ? new Date(a.next_action_date).getTime() : Infinity;
        const dateB = b.next_action_date ? new Date(b.next_action_date).getTime() : Infinity;
        return dateA - dateB;
      });
      setCustomers(activeCustomers.slice(0, 5));
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sending) return;

    setSending(true);
    try {
      const data = await apiPost<AnalyzeResult>("/api/suggestions/analyze", { 
        content: content.trim(),
        mode: inputMode
      });
      setAnalyzeResult(data);
      
      const now = new Date();
      const timeStr = now.toISOString().slice(0, 16);
      setActivityTime(timeStr);
      
      if (data.customers.length > 0) {
        setEditableCustomer({ ...data.customers[0] });
      } else {
        setEditableCustomer(null);
      }
      
      if (data.contacts.length > 0) {
        const contact = data.contacts[0];
        setEditableContact({ name: contact.name || "", position: contact.position || "", phone: contact.phone || "" });
      } else {
        setEditableContact(null);
      }
      
      if (data.projects.length > 0) {
        setEditableProject({ ...data.projects[0] });
      } else {
        setEditableProject(null);
      }
      
      setEditableTasks(data.tasks.map(t => ({ ...t })));
      setEditableActivity(data.activity_content || data.raw_content);
      
      setContent("");
      setShowModal(true);
      textareaRef.current?.focus();
    } catch {} finally {
      setSending(false);
    }
  };

  const handleConfirm = async () => {
    if (!analyzeResult || confirming) return;
    setConfirming(true);
    try {
      const payload: any = {};
      if (editableCustomer) {
        payload.customer = editableCustomer;
      }
      if (editableProject) {
        payload.project = editableProject;
      }
      if (editableTasks.length > 0) {
        payload.tasks = editableTasks;
      }
      if (editableActivity) {
        payload.activity = editableActivity;
      }
      if (activityTime) {
        payload.activity_time = activityTime;
      }

      await apiPost(`/api/suggestions/${analyzeResult.suggestion_id}/confirm`, payload);

      setShowModal(false);
      setAnalyzeResult(null);
      setEditableCustomer(null);
      setEditableContact(null);
      setEditableProject(null);
      setEditableTasks([]);
      setEditableActivity("");
      loadActivities();
      loadTasks();
      loadCustomers();
    } catch {}
    setConfirming(false);
  };

  const handleCancel = () => {
    setShowModal(false);
    setAnalyzeResult(null);
    setEditableCustomer(null);
    setEditableContact(null);
    setEditableProject(null);
    setEditableTasks([]);
    setEditableActivity("");
    setExpandedContent(false);
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: Task["status"]) => {
    try {
      await apiPatch(`/api/tasks/${taskId}`, { status: newStatus });
      loadTasks();
    } catch {}
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await apiDelete(`/api/tasks/${taskId}`);
      loadTasks();
      setShowTaskMenu(null);
    } catch {}
  };

  const handleTaskPin = async (taskId: string, isPinned: boolean) => {
    try {
      await apiPatch(`/api/tasks/${taskId}`, { is_pinned: !isPinned });
      loadTasks();
    } catch {}
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "今天";
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return "明天";
    }
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric", timeZone: "Asia/Shanghai" });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "今天";
    if (days === 1) return "昨天";
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric", timeZone: "Asia/Shanghai" });
  };

  const getStageClass = (stage: string) => {
    if (!stage) return "bg-muted/50 text-muted-foreground";
    if (stage.includes("线索")) return "bg-blue-500/10 text-blue-600";
    if (stage.includes("确认")) return "bg-green-500/10 text-green-600";
    if (stage.includes("方案")) return "bg-purple-500/10 text-purple-600";
    if (stage.includes("验证")) return "bg-cyan-500/10 text-cyan-600";
    if (stage.includes("谈判")) return "bg-orange-500/10 text-orange-600";
    if (stage.includes("成交")) return "bg-emerald-500/10 text-emerald-600";
    if (stage.includes("暂停")) return "bg-gray-500/10 text-gray-600";
    return "bg-muted/50 text-muted-foreground";
  };

  const truncateContent = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const getStatusLabel = (status: Task["status"]) => {
    switch (status) {
      case "TODO":
        return "待办";
      case "DOING":
        return "进行中";
      case "DONE":
        return "已完成";
    }
  };

  const getStatusClass = (status: Task["status"]) => {
    switch (status) {
      case "TODO":
        return "bg-muted text-muted-foreground";
      case "DOING":
        return "bg-blue-500/10 text-blue-600";
      case "DONE":
        return "bg-green-500/10 text-green-600";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-500";
      case "MEDIUM":
        return "bg-yellow-500";
      case "LOW":
        return "bg-blue-400";
      default:
        return "bg-muted";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "高";
      case "MEDIUM":
        return "中";
      case "LOW":
        return "低";
    }
  };

  const getStatusLabelCustomer = (status: Customer["status"]) => {
    switch (status) {
      case "ACTIVE":
        return "跟进中";
      case "FOLLOWING":
        return "重点推进";
      case "PAUSED":
        return "已暂停";
      case "LOST":
        return "已丢失";
    }
  };

  const getLevelClass = (level: string) => {
    switch (level) {
      case "HIGH":
        return "bg-red-500/10 text-red-600";
      case "MEDIUM":
        return "bg-yellow-500/10 text-yellow-700";
      case "LOW":
        return "bg-blue-500/10 text-blue-600";
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
    }
  };

  const formatBudget = (budget: number | undefined) => {
    if (!budget) return "";
    if (budget >= 10000) {
      return `${(budget / 10000).toFixed(0)}万`;
    }
    return `${budget}元`;
  };

  const hasData = () => {
    return analyzeResult && (
      analyzeResult.customers.length > 0 ||
      analyzeResult.projects.length > 0 ||
      analyzeResult.tasks.length > 0
    );
  };

  const getFilteredTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return tasks.filter((task) => {
      if (activeTab === "completed") {
        return task.status === "DONE";
      }
      
      if (task.status === "DONE") return false;
      
      if (!task.due_date) {
        return activeTab === "all";
      }
      
      const dueDate = new Date(task.due_date);
      if (isNaN(dueDate.getTime())) {
        return activeTab === "all";
      }
      dueDate.setHours(0, 0, 0, 0);
      
      switch (activeTab) {
        case "today":
          return dueDate.getTime() === today.getTime();
        case "7days":
          const sevenDaysLater = new Date(today);
          sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
          return dueDate >= today && dueDate <= sevenDaysLater;
        case "30days":
          const thirtyDaysLater = new Date(today);
          thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
          return dueDate >= today && dueDate <= thirtyDaysLater;
        case "all":
        default:
          return true;
      }
    }).sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  };

  const getDashboardStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTasks = tasks.filter(t => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === today.getTime() && t.status !== "DONE";
    });
    
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const upcomingOverdueTasks = tasks.filter(t => {
      if (!t.due_date || t.status === "DONE") return false;
      const dueDate = new Date(t.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate > today && dueDate <= threeDaysLater;
    });
    
    const needFollowUpCustomers = customers.filter(c => {
      if (c.status === "LOST" || c.status === "PAUSED") return false;
      if (!c.next_action_date) return true;
      const nextDate = new Date(c.next_action_date);
      nextDate.setHours(0, 0, 0, 0);
      return nextDate <= today;
    }).length;
    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const recentNewCustomers = customers.filter(c => {
      const createdAt = new Date(c.created_at);
      return createdAt >= lastWeek;
    }).length;
    
    return {
      todayTasks: todayTasks.length,
      needFollowUpCustomers,
      upcomingOverdue: upcomingOverdueTasks.length,
      recentNewCustomers,
      todo: tasks.filter(t => t.status === "TODO").length,
      sevenDays: tasks.filter(t => {
        if (!t.due_date || t.status === "DONE") return false;
        const dueDate = new Date(t.due_date);
        dueDate.setHours(0, 0, 0, 0);
        const sevenDaysLater = new Date(today);
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
        return dueDate >= today && dueDate <= sevenDaysLater;
      }).length,
      overdue: tasks.filter(t => {
        if (!t.due_date || t.status === "DONE") return false;
        const dueDate = new Date(t.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      }).length,
      completed: tasks.filter(t => t.status === "DONE").length
    };
  };

  const stats = getDashboardStats();

  return (
    <div className="min-h-screen pb-32">
      <div className="mt-8 mb-8">
        <h1 className="text-2xl font-semibold mb-2">工作台</h1>
        <p className="text-sm text-muted-foreground">欢迎回来，今天继续加油</p>
      </div>

      <div className="bg-card rounded-2xl shadow-sm p-6 mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground mb-6">今日重点</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <ListTodo className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">今日待办</span>
            </div>
            <p className="text-2xl font-bold">{stats.todayTasks}</p>
            <p className="text-xs text-muted-foreground mt-1">今天要完成的任务</p>
          </div>
          <div className="bg-muted/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <User className="w-4 h-4 text-green-500" />
              </div>
              <span className="text-xs text-muted-foreground">待跟进客户</span>
            </div>
            <p className="text-2xl font-bold">{stats.needFollowUpCustomers}</p>
            <p className="text-xs text-muted-foreground mt-1">需要联系的客户</p>
          </div>
          <div className="bg-muted/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-xs text-muted-foreground">即将超期</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats.upcomingOverdue}</p>
            <p className="text-xs text-muted-foreground mt-1">3天内到期的任务</p>
          </div>
          <div className="bg-muted/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-xs text-muted-foreground">新增客户</span>
            </div>
            <p className="text-2xl font-bold">{stats.recentNewCustomers}</p>
            <p className="text-xs text-muted-foreground mt-1">最近7天新增</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-8">
        <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">任务中心</h2>
              <div className="flex items-center bg-muted/30 rounded-lg p-1">
                {[
                  { key: "today", label: "今日" },
                  { key: "7days", label: "7天" },
                  { key: "30days", label: "30天" },
                  { key: "all", label: "全部" },
                  { key: "completed", label: "已完成" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6">
            {getFilteredTasks().length > 0 ? (
              <div className="space-y-4">
                {getFilteredTasks().map((task) => (
                  <div
                    key={task.id}
                    className={`bg-muted/20 rounded-xl p-4 transition-all ${
                      task.status === "DONE"
                        ? "opacity-60"
                        : "hover:bg-muted/40"
                    } ${task.is_pinned ? "border-l-4 border-primary" : ""}`}
                  >
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => {
                          const nextStatus: Task["status"] =
                            task.status === "TODO"
                              ? "DOING"
                              : task.status === "DOING"
                              ? "DONE"
                              : "TODO";
                          handleTaskStatusChange(task.id, nextStatus);
                        }}
                        className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          task.status === "DONE"
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {task.status === "DONE" && <CheckCircle className="w-3 h-3" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {task.is_pinned && (
                            <Pin className="w-3 h-3 text-primary flex-shrink-0" />
                          )}
                          <p
                            className={`text-sm font-medium ${
                              task.status === "DONE"
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {task.title}
                          </p>
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-3">
                          {task.customer_name && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="w-3 h-3" />
                              {task.customer_name}
                            </span>
                          )}
                          {task.project_name && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Folder className="w-3 h-3" />
                              {task.project_name}
                            </span>
                          )}
                          {task.due_date && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {formatDate(task.due_date)}
                            </span>
                          )}
                          <span
                            className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}
                            title={getPriorityLabel(task.priority)}
                          />
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusClass(task.status)}`}>
                            {getStatusLabel(task.status)}
                          </span>
                        </div>
                      </div>

                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowTaskMenu(showTaskMenu === task.id ? null : task.id)
                          }
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </button>
                        {showTaskMenu === task.id && (
                          <div className="absolute right-0 top-full mt-2 bg-card rounded-lg shadow-lg border border-border p-2 min-w-[120px] z-10">
                            <button
                              onClick={() => {
                                setEditingTask(task);
                                setShowTaskMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-md transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                              编辑
                            </button>
                            <button
                              onClick={() => {
                                handleTaskPin(task.id, task.is_pinned || false);
                                setShowTaskMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-md transition-colors"
                            >
                              <Pin className="w-4 h-4" />
                              {task.is_pinned ? "取消置顶" : "置顶"}
                            </button>
                            <button
                              onClick={() => handleTaskDelete(task.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-500/10 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              删除
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ListTodo className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">暂无任务</p>
                <p className="text-sm text-muted-foreground mt-2">在下方输入框添加新任务</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold">重点客户</h2>
          </div>

          <div className="p-6">
            {customers.length > 0 ? (
              <div className="space-y-4">
                {customers.map((customer) => (
                  <Link
                    key={customer.id}
                    href={`/customers/${customer.id}`}
                    className="block bg-muted/20 rounded-xl p-4 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getLevelClass(customer.level)}`}>
                        {getLevelLabel(customer.level)}
                      </span>
                      <h3 className="font-semibold">{customer.company || customer.name}</h3>
                    </div>
                    
                    <div className="space-y-2">
                      {customer.projects && customer.projects.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-muted-foreground font-medium mt-0.5 w-12 flex-shrink-0">项目：</span>
                          <span className="text-sm text-foreground/80">{customer.projects[0].name}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium w-12 flex-shrink-0">阶段：</span>
                        <span className={`text-sm font-medium ${getStageClass(customer.ai_summary?.stage || "")} px-2 py-0.5 rounded-md`}>
                          {customer.ai_summary?.stage || "线索"}
                        </span>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-muted-foreground font-medium mt-0.5 w-12 flex-shrink-0">下一步：</span>
                        <span className="text-sm text-foreground/80">{customer.next_action || "暂无"}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium w-12 flex-shrink-0">最后沟通：</span>
                        <span className="text-sm text-muted-foreground">{formatDateTime(customer.updated_at)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">暂无重点客户</p>
                <p className="text-sm text-muted-foreground mt-2">在下方输入框记录客户信息</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && analyzeResult && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">AI已识别以下内容</h2>
              </div>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {analyzeResult.matched_customer && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/5 rounded-lg px-3 py-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>已匹配客户: {analyzeResult.matched_customer.name}</span>
                </div>
              )}

              {(editableCustomer || editableContact) && (
                <div className="bg-muted/30 rounded-xl p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
                    <User className="w-4 h-4" />
                    <span>已识别客户</span>
                  </div>
                  <div className="space-y-3">
                    {editableCustomer && (
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">公司名称</label>
                        <input
                          type="text"
                          value={editableCustomer.name}
                          onChange={(e) => setEditableCustomer({ ...editableCustomer, name: e.target.value })}
                          className="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
                          placeholder="公司名称"
                        />
                      </div>
                    )}
                    {editableContact && (
                      <>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">联系人</label>
                          <input
                            type="text"
                            value={editableContact.name}
                            onChange={(e) => setEditableContact({ ...editableContact, name: e.target.value })}
                            className="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            placeholder="联系人姓名"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">职位</label>
                            <input
                              type="text"
                              value={editableContact.position}
                              onChange={(e) => setEditableContact({ ...editableContact, position: e.target.value })}
                              className="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                              placeholder="职位"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">电话</label>
                            <input
                              type="text"
                              value={editableContact.phone}
                              onChange={(e) => setEditableContact({ ...editableContact, phone: e.target.value })}
                              className="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                              placeholder="电话号码"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-muted/30 rounded-xl p-5">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
                  <FileText className="w-4 h-4" />
                  <span>建议记录</span>
                </div>
                <textarea
                  value={editableActivity}
                  onChange={(e) => setEditableActivity(e.target.value)}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm leading-relaxed h-32 resize-none"
                  placeholder="AI优化后的活动记录..."
                />
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-muted-foreground">记录时间:</span>
                  <input
                    type="datetime-local"
                    value={activityTime}
                    onChange={(e) => setActivityTime(e.target.value)}
                    className="px-3 py-1.5 bg-card border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>

              {editableProject && (
                <div className="bg-muted/30 rounded-xl p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
                    <Folder className="w-4 h-4" />
                    <span>项目状态</span>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editableProject.name}
                      onChange={(e) => setEditableProject({ ...editableProject, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                      placeholder="项目名称"
                    />
                    <textarea
                      value={editableProject.description || ""}
                      onChange={(e) => setEditableProject({ ...editableProject, description: e.target.value })}
                      className="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm h-20 resize-none"
                      placeholder="项目描述"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">当前阶段:</span>
                      <select
                        value={editableProject.status}
                        onChange={(e) => setEditableProject({ ...editableProject, status: e.target.value })}
                        className="px-3 py-1.5 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary/20"
                      >
                        {projectStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {editableProject.budget && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">预算:</span>
                        <span className="text-sm font-medium text-amber-600">{formatBudget(editableProject.budget)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {editableTasks.length > 0 && (
                <div className="bg-muted/30 rounded-xl p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
                    <ListTodo className="w-4 h-4" />
                    <span>建议任务</span>
                  </div>
                  <div className="space-y-3">
                    {editableTasks.map((task, index) => (
                      <div key={index} className="bg-card rounded-lg p-4">
                        <input
                          type="text"
                          value={task.title}
                          onChange={(e) => {
                            const newTasks = [...editableTasks];
                            newTasks[index].title = e.target.value;
                            setEditableTasks(newTasks);
                          }}
                          className="w-full px-3 py-2 bg-transparent border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/20 text-sm font-medium"
                          placeholder="任务名称"
                        />
                        <div className="flex items-center gap-3 mt-3">
                          <input
                            type="date"
                            value={task.due_date || ""}
                            onChange={(e) => {
                              const newTasks = [...editableTasks];
                              newTasks[index].due_date = e.target.value;
                              setEditableTasks(newTasks);
                            }}
                            className="px-3 py-1.5 bg-muted/50 border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary/20"
                          />
                          <select
                            value={task.priority}
                            onChange={(e) => {
                              const newTasks = [...editableTasks];
                              newTasks[index].priority = e.target.value;
                              setEditableTasks(newTasks);
                            }}
                            className="px-3 py-1.5 bg-muted/50 border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary/20"
                          >
                            <option value="HIGH">高优先级</option>
                            <option value="MEDIUM">中优先级</option>
                            <option value="LOW">低优先级</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!hasData() && (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">未识别到可创建的内容</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    请尝试输入包含客户名称、公司、预算、日期等关键词的内容
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-border/50 bg-muted/20 flex-shrink-0">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirming || !hasData()}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{confirming ? "写入中..." : "确认写入CRM"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {editingTask && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold">编辑任务</h2>
              <button
                onClick={() => setEditingTask(null)}
                className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-5">
              <input
                type="text"
                defaultValue={editingTask.title}
                className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <textarea
                defaultValue={editingTask.description}
                placeholder="任务描述"
                className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 mt-4 h-24 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-border">
              <button
                onClick={() => setEditingTask(null)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setEditingTask(null);
                }}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium transition-all hover:bg-primary/90"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        ref={bottomInputRef}
        className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-40"
      >
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-3 bg-muted/30 rounded-2xl p-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUploadMenu(!showUploadMenu)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <Plus className="w-5 h-5 text-muted-foreground" />
                </button>
                {showUploadMenu && (
                  <div className="absolute bottom-full left-0 mb-2 bg-card rounded-lg shadow-lg border border-border p-2 min-w-[140px]">
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-md transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      上传图片
                    </button>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-md transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      上传文档
                    </button>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-md transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      上传录音
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2">
                  <select
                    value={inputMode}
                    onChange={(e) => setInputMode(e.target.value as InputMode)}
                    className="bg-foreground/10 border border-foreground/20 text-foreground rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary/20"
                  >
                    {inputModes.map((mode) => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="老板，有什么可以帮忙的？"
                  className="w-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed placeholder:text-muted-foreground/40 pl-24"
                  rows={1}
                />
              </div>

              <button
                type="submit"
                disabled={!content.trim() || sending}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{sending ? "分析中..." : "分析"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}