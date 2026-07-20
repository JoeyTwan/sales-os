"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, User, Folder, FileText, Calendar, Clock, Target, DollarSign, Users, Zap, TrendingUp, AlertTriangle, RefreshCw, Brain, Plus, X } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";

interface Customer {
  id: string;
  name: string;
  level: "HIGH" | "MEDIUM" | "LOW";
  status: "ACTIVE" | "FOLLOWING" | "PAUSED" | "LOST";
  summary: string;
  next_action: string;
  next_action_date: string;
  created_at: string;
  updated_at: string;
  ai_summary?: CustomerAISummary;
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
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  task_completion_rate: number;
}

interface Project {
  id: string;
  customer_id: string;
  name: string;
  description: string;
  budget: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Activity {
  id: string;
  customer_id: string;
  project_id: string | null;
  content: string;
  source: string;
  activity_date: string;
  created_at: string;
}

interface TimelineItem {
  id: string;
  type: string;
  title: string;
  content: string;
  timestamp: string;
  status?: string;
  priority?: string;
}

interface Task {
  id: string;
  customer_id: string | null;
  project_id: string | null;
  title: string;
  description: string | null;
  status: "TODO" | "DOING" | "DONE";
  priority: "HIGH" | "MEDIUM" | "LOW";
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [brainInput, setBrainInput] = useState("");
  const [brainMessages, setBrainMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectError, setProjectError] = useState("");
  const [newProject, setNewProject] = useState({
    name: "",
    customer_id: id as string,
    status: "LEAD" as Project["status"],
    budget: "",
    description: "",
  });

  useEffect(() => {
    loadCustomer();
    loadProjects();
    loadActivities();
    loadTasks();
    loadTimeline();
  }, [id]);

  const loadCustomer = async () => {
    try {
      const data = await apiGet<Customer>(`/api/customers/${id}`);
      setCustomer(data);
    } catch {}
  };

  const loadProjects = async () => {
    try {
      const data = await apiGet<Project[]>(`/api/projects/customer/${id}`);
      const projectsWithTaskCount = await Promise.all(
        data.map(async (project: Project) => {
          try {
            const tasksData = await apiGet<Task[]>(`/api/tasks/project/${project.id}`);
            return { ...project, task_count: tasksData.length };
          } catch {}
          return { ...project, task_count: 0 };
        })
      );
      setProjects(projectsWithTaskCount);
    } catch {}
  };

  const loadActivities = async () => {
    try {
      const data = await apiGet<Activity[]>(`/api/activities/customer/${id}`);
      data.sort((a: Activity, b: Activity) => 
        new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime()
      );
      setActivities(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const data = await apiGet<Task[]>(`/api/tasks/customer/${id}`);
      setTasks(data);
    } catch {}
  };

  const loadTimeline = async () => {
    try {
      const data = await apiGet<TimelineItem[]>(`/api/activities/customer/${id}/timeline`);
      setTimeline(data);
    } catch {}
  };

  const refreshAISummary = async () => {
    setRefreshing(true);
    try {
      await apiPost(`/api/customers/${id}/ai-summary/refresh`, {});
      await loadCustomer();
    } catch {} finally {
      setRefreshing(false);
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
    }
  };

  const getProjectStatusLabel = (status: string) => {
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

  const getProjectStatusClass = (status: string) => {
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
    }
  };

  const getSourceClass = (source: string) => {
    switch (source) {
      case "capture":
        return "bg-primary/10 text-primary";
      case "manual":
        return "bg-muted/50 text-muted-foreground";
      case "email":
        return "bg-blue-500/10 text-blue-600";
      case "phone":
        return "bg-green-500/10 text-green-600";
      case "meeting":
        return "bg-purple-500/10 text-purple-600";
    }
  };

  const getStageClass = (stage: string) => {
    if (!stage) return "bg-muted/50 text-muted-foreground";
    if (stage.includes("线索")) return "bg-blue-500/10 text-blue-600";
    if (stage.includes("确认")) return "bg-green-500/10 text-green-600";
    if (stage.includes("方案")) return "bg-purple-500/10 text-purple-600";
    if (stage.includes("谈判")) return "bg-orange-500/10 text-orange-600";
    if (stage.includes("成交")) return "bg-emerald-500/10 text-emerald-600";
    if (stage.includes("流失")) return "bg-red-500/10 text-red-600";
    return "bg-muted/50 text-muted-foreground";
  };

  const getTaskStatusLabel = (status: string) => {
    switch (status) {
      case "TODO":
        return "待办";
      case "DOING":
        return "进行中";
      case "DONE":
        return "已完成";
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
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-emerald-600";
    if (confidence >= 50) return "text-amber-600";
    return "text-red-600";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "今天";
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return "昨天";
    }
    return date.toLocaleDateString("zh-CN", { year: "numeric", month: "short", day: "numeric" });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const formatBudget = (budget: number | undefined) => {
    if (!budget) return "";
    if (budget >= 10000) {
      return `${(budget / 10000).toFixed(0)}万`;
    }
    return `${budget}元`;
  };

  const truncateContent = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "刚刚";
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return formatDate(dateStr);
  };

  const groupActivitiesByDate = () => {
    const groups: Record<string, Activity[]> = {};
    activities.forEach((activity) => {
      const date = formatDate(activity.activity_date);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
    });
    return groups;
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

  if (!customer) {
    return (
      <div className="py-8">
        <p className="text-muted-foreground">客户不存在</p>
      </div>
    );
  }

  const activityGroups = groupActivitiesByDate();
  const aiSummary = customer.ai_summary;

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return;
    setCreatingProject(true);
    setProjectError("");
    try {
      await apiPost("/api/projects", {
        ...newProject,
        budget: newProject.budget ? parseInt(newProject.budget) : null,
      });
      setShowProjectModal(false);
      setNewProject({
        name: "",
        customer_id: id as string,
        status: "LEAD",
        budget: "",
        description: "",
      });
      loadProjects();
    } catch (err) {
      setProjectError("创建项目失败，请稍后重试");
      console.error("Create project error:", err);
    } finally {
      setCreatingProject(false);
    }
  };

  return (
    <div className="py-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回</span>
        </button>
        <h1 className="text-2xl font-semibold">{customer.name}</h1>
        <span className={`ml-auto px-3 py-1 text-xs font-medium rounded-full ${getLevelClass(customer.level)}`}>
          {getLevelLabel(customer.level)}
        </span>
      </div>

      <div className="bg-card rounded-xl shadow-sm p-6 mb-8 border border-primary/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">客户战略大脑</span>
          </div>
          <button
            onClick={refreshAISummary}
            disabled={refreshing}
            className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            <span>刷新</span>
          </button>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
          {aiSummary?.last_activity_summary || "暂无分析数据"}
        </p>
      </div>

      <div className="bg-card rounded-xl shadow-sm p-6 mb-8">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-4">
          <Zap className="w-4 h-4" />
          <span>客户大脑对话</span>
        </div>
        
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
          {brainMessages.map((msg, index) => (
            <div key={index} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary/10' : 'bg-muted/30'}`}>
              <p className="text-xs text-muted-foreground mb-1">{msg.role === 'user' ? '用户' : 'AI'}</p>
              <p className="text-sm">{msg.content}</p>
            </div>
          ))}
          {brainMessages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">开始与客户大脑对话...</p>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-border flex gap-2">
          <input
            type="text"
            value={brainInput}
            onChange={(e) => setBrainInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setBrainMessages([...brainMessages, { role: 'user', content: brainInput }, { role: 'ai', content: '正在分析中...' }]);
                setBrainInput('');
              }
            }}
            className="flex-1 bg-zinc-800 dark:bg-zinc-800 light:bg-gray-100 border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="输入问题..."
          />
          <button
            onClick={() => {
              if (brainInput.trim()) {
                setBrainMessages([...brainMessages, { role: 'user', content: brainInput }, { role: 'ai', content: '正在分析中...' }]);
                setBrainInput('');
              }
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
          >
            发送
          </button>
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
                <p className="text-sm font-medium">{getStatusLabel(customer.status)}</p>
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
              <div>
                <p className="text-xs text-muted-foreground mb-1">最近更新</p>
                <p className="text-sm text-foreground/80">{formatDateTime(customer.updated_at)}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Folder className="w-4 h-4" />
                <span>项目列表</span>
              </div>
              <button
                onClick={() => {
                  setNewProject({
                    name: "",
                    customer_id: id as string,
                    status: "LEAD",
                    budget: "",
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
                  <div key={project.id} className="p-4 rounded-xl bg-muted/30">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium">{project.name}</p>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${getProjectStatusClass(project.status)}`}>
                        {getProjectStatusLabel(project.status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-1">预计金额</p>
                        <p className="font-medium text-amber-600">{formatBudget(project.budget) || "-"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">更新时间</p>
                        <p className="font-medium">{formatDate(project.updated_at)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">任务数</p>
                        <p className="font-medium">{(project as any).task_count || 0}</p>
                      </div>
                    </div>
                  </div>
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
                      budget: "",
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
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-6">
              <Target className="w-4 h-4" />
              <span>任务列表</span>
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
              <span>时间线</span>
            </div>

            {timeline.length > 0 ? (
              <div className="relative">
                <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border"></div>
                <div className="space-y-6">
                  {timeline.map((item) => {
                    const iconColor = item.type === 'activity' ? 'bg-primary/10 text-primary' : 
                                     item.type === 'task' ? 'bg-blue-500/10 text-blue-600' : 
                                     'bg-purple-500/10 text-purple-600';
                    const IconComponent = item.type === 'activity' ? FileText : 
                                         item.type === 'task' ? Target : Folder;
                    
                    return (
                      <div key={item.id} className="relative">
                        <div className={`absolute left-0 w-10 h-10 rounded-full ${iconColor} flex items-center justify-center z-10`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="ml-14 bg-muted/30 rounded-xl p-5">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${iconColor}`}>
                              {item.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(item.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                            {item.content}
                          </p>
                          {item.status && item.type === 'project' && (
                            <div className="flex items-center gap-2 mt-3">
                              <span className="text-xs text-muted-foreground">状态:</span>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getProjectStatusClass(item.status)}`}>
                                {getProjectStatusLabel(item.status)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">暂无活动记录</p>
                <p className="text-sm text-muted-foreground mt-2">通过 Capture 录入内容后，会自动记录到这里</p>
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