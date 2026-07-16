"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, User, Folder, FileText, Calendar, Clock } from "lucide-react";

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

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomer();
    loadProjects();
    loadActivities();
  }, [id]);

  const loadCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
      }
    } catch {}
  };

  const loadProjects = async () => {
    try {
      const response = await fetch(`/api/projects/customer/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch {}
  };

  const loadActivities = async () => {
    try {
      const response = await fetch(`/api/activities/customer/${id}`);
      if (response.ok) {
        const data = await response.json();
        data.sort((a: Activity, b: Activity) => 
          new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime()
        );
        setActivities(data);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const getLevelClass = (level: string) => {
    switch (level) {
      case "HIGH":
        return "bg-red-500/10 text-red-600";
      case "MEDIUM":
        return "bg-yellow-500/10 text-yellow-700";
      case "LOW":
        return "bg-gray-500/10 text-gray-600";
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
        return "线索";
      case "QUALIFIED":
        return "已确认";
      case "PROPOSAL":
        return "方案中";
      case "NEGOTIATION":
        return "谈判中";
      case "WON":
        return "已成交";
      case "LOST":
        return "已流失";
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
      case "NEGOTIATION":
        return "bg-orange-500/10 text-orange-600";
      case "WON":
        return "bg-emerald-500/10 text-emerald-600";
      case "LOST":
        return "bg-red-500/10 text-red-600";
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "capture":
        return "智能录入";
      case "manual":
        return "手动记录";
      case "email":
        return "邮件";
      case "meeting":
        return "会议";
    }
  };

  const getSourceClass = (source: string) => {
    switch (source) {
      case "capture":
        return "bg-primary/10 text-primary";
      case "manual":
        return "bg-gray-500/10 text-gray-600";
      case "email":
        return "bg-blue-500/10 text-blue-600";
      case "meeting":
        return "bg-purple-500/10 text-purple-600";
    }
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
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-4">
              <Folder className="w-4 h-4" />
              <span>项目列表</span>
            </div>
            {projects.length > 0 ? (
              <div className="space-y-3">
                {projects.map((project) => (
                  <div key={project.id} className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">{project.name}</p>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getProjectStatusClass(project.status)}`}>
                        {getProjectStatusLabel(project.status)}
                      </span>
                    </div>
                    {project.budget && (
                      <p className="text-xs text-amber-600">预算: {formatBudget(project.budget)}</p>
                    )}
                    {project.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{truncateContent(project.description, 50)}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">暂无项目</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-6">
              <Clock className="w-4 h-4" />
              <span>时间线</span>
            </div>

            {activities.length > 0 ? (
              <div className="relative">
                <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border"></div>
                <div className="space-y-6">
                  {Object.entries(activityGroups).map(([date, dateActivities]) => (
                    <div key={date}>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-card border-2 border-primary flex items-center justify-center z-10">
                          <Calendar className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium">{date}</span>
                      </div>
                      <div className="ml-14 space-y-4">
                        {dateActivities.map((activity) => (
                          <div key={activity.id} className="bg-muted/30 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSourceClass(activity.source)}`}>
                                {getSourceLabel(activity.source)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDateTime(activity.created_at)}
                              </span>
                            </div>
                            <div className="flex items-start gap-3">
                              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                                {activity.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
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
    </div>
  );
}