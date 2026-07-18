"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, DollarSign, Calendar, AlertTriangle, Clock } from "lucide-react";
import { apiGet } from "@/lib/api";

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
  level: "HIGH" | "MEDIUM" | "LOW";
  status: "ACTIVE" | "FOLLOWING" | "PAUSED" | "LOST";
  summary: string;
  next_action: string;
  next_action_date: string;
  created_at: string;
  updated_at: string;
  ai_summary?: CustomerAISummary;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await apiGet<Customer[]>("/api/customers");
      setCustomers(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const getLevelClass = (level: Customer["level"]) => {
    switch (level) {
      case "HIGH":
        return "bg-red-500/10 text-red-600";
      case "MEDIUM":
        return "bg-yellow-500/10 text-yellow-700";
      case "LOW":
        return "bg-muted/50 text-muted-foreground";
    }
  };

  const getLevelLabel = (level: Customer["level"]) => {
    switch (level) {
      case "HIGH":
        return "高";
      case "MEDIUM":
        return "中";
      case "LOW":
        return "低";
    }
  };

  const getStatusLabel = (status: Customer["status"]) => {
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) {
      return "今天";
    } else if (days === 1) {
      return "昨天";
    } else if (days < 7) {
      return `${days}天前`;
    }
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };

  const truncateActivity = (text: string, maxLen: number = 80) => {
    if (!text) return "";
    return text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
  };

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">客户管理</h1>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
          新建客户
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <span className="text-muted-foreground">加载中...</span>
        </div>
      ) : customers.length > 0 ? (
        <div className="space-y-4">
          {customers.map((customer) => (
            <Link
              key={customer.id}
              href={`/customers/${customer.id}`}
              className="block bg-card rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-lg font-medium">{customer.name}</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getLevelClass(customer.level)}`}>
                      {getLevelLabel(customer.level)}
                    </span>
                    <span className="text-sm text-muted-foreground">{getStatusLabel(customer.status)}</span>
                  </div>
                  
                  {customer.ai_summary && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className={`text-sm font-medium ${getStageClass(customer.ai_summary.stage)} px-2 py-1 rounded-md`}>
                            {customer.ai_summary.stage || "线索阶段"}
                          </span>
                        </div>
                        {customer.ai_summary.budget && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-sm font-medium text-amber-600">{customer.ai_summary.budget}</span>
                          </div>
                        )}
                      </div>
                      
                      {customer.ai_summary.risk && (
                        <div className="flex items-center gap-2 text-orange-600 bg-orange-50/50 px-3 py-2 rounded-lg">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm">{customer.ai_summary.risk}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="text-foreground/70">{customer.ai_summary.next_action || "暂无下一步"}</span>
                        {customer.ai_summary.estimated_close_date && (
                          <>
                            <span className="text-border">|</span>
                            <Calendar className="w-3.5 h-3.5" />
                            <span>预计签约: {formatDate(customer.ai_summary.estimated_close_date)}</span>
                          </>
                        )}
                      </div>
                      
                      {customer.ai_summary.last_activity_summary && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
                          <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          <span>{truncateActivity(customer.ai_summary.last_activity_summary)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">最近更新</p>
                  <p className="text-sm font-medium">{formatDateTime(customer.updated_at)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-sm p-12 text-center">
          <p className="text-muted-foreground">暂无客户</p>
        </div>
      )}
    </div>
  );
}