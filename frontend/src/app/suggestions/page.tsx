"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle, XCircle, Clock } from "lucide-react";

interface CustomerSuggestion {
  name: string;
  company?: string;
  level: string;
  status: string;
}

interface TaskSuggestion {
  title: string;
  priority: string;
  due_date?: string;
}

interface SuggestionJSON {
  customer_suggestions: CustomerSuggestion[];
  task_suggestions: TaskSuggestion[];
}

interface Suggestion {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  raw_content: string;
  suggestion_json: SuggestionJSON;
  created_at: string;
}

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/suggestions");
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch {}
    setLoading(false);
  };

  const getStatusLabel = (status: Suggestion["status"]) => {
    switch (status) {
      case "PENDING":
        return "待确认";
      case "CONFIRMED":
        return "已确认";
      case "CANCELLED":
        return "已取消";
    }
  };

  const getStatusClass = (status: Suggestion["status"]) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-500/10 text-amber-600";
      case "CONFIRMED":
        return "bg-green-500/10 text-green-600";
      case "CANCELLED":
        return "bg-gray-500/10 text-gray-600";
    }
  };

  const getStatusIcon = (status: Suggestion["status"]) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4" />;
      case "CONFIRMED":
        return <CheckCircle className="w-4 h-4" />;
      case "CANCELLED":
        return <XCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pendingSuggestions = suggestions.filter((s) => s.status === "PENDING");
  const confirmedSuggestions = suggestions.filter((s) => s.status === "CONFIRMED");
  const cancelledSuggestions = suggestions.filter((s) => s.status === "CANCELLED");

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">AI建议中心</h1>
          <p className="text-sm text-muted-foreground mt-1">共 {suggestions.length} 条建议</p>
        </div>
      </div>

      {pendingSuggestions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>待确认</span>
            <span className="text-xs text-muted-foreground ml-2">{pendingSuggestions.length} 条</span>
          </h2>
          <div className="space-y-4">
            {pendingSuggestions.map((suggestion) => (
              <Link
                key={suggestion.id}
                href={`/suggestions/${suggestion.id}`}
                className="block bg-card rounded-xl shadow-sm p-6 group hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-lg leading-relaxed group-hover:text-primary transition-colors">
                      {suggestion.raw_content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-3">{formatDate(suggestion.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${getStatusClass(suggestion.status)}`}>
                      {getStatusIcon(suggestion.status)}
                      {getStatusLabel(suggestion.status)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
                {suggestion.suggestion_json && (
                  <div className="flex gap-4 mt-4 pt-4 border-t border-border">
                    {suggestion.suggestion_json.customer_suggestions?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-xs text-muted-foreground">
                          {suggestion.suggestion_json.customer_suggestions.length} 个客户建议
                        </span>
                      </div>
                    )}
                    {suggestion.suggestion_json.task_suggestions?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-xs text-muted-foreground">
                          {suggestion.suggestion_json.task_suggestions.length} 个任务建议
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {confirmedSuggestions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>已确认</span>
          </h2>
          <div className="space-y-4">
            {confirmedSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="bg-card rounded-xl shadow-sm p-6 opacity-70">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-lg leading-relaxed">{suggestion.raw_content}</p>
                    <p className="text-xs text-muted-foreground mt-3">{formatDate(suggestion.created_at)}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusClass(suggestion.status)}`}>
                    {getStatusLabel(suggestion.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {cancelledSuggestions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-gray-500" />
            <span>已取消</span>
          </h2>
          <div className="space-y-4">
            {cancelledSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="bg-card rounded-xl shadow-sm p-6 opacity-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-lg leading-relaxed">{suggestion.raw_content}</p>
                    <p className="text-xs text-muted-foreground mt-3">{formatDate(suggestion.created_at)}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusClass(suggestion.status)}`}>
                    {getStatusLabel(suggestion.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {suggestions.length === 0 && !loading && (
        <div className="bg-card rounded-xl shadow-sm p-12 text-center">
          <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">暂无AI建议</p>
          <p className="text-sm text-muted-foreground mt-2">在工作台输入内容后会自动分析生成建议</p>
        </div>
      )}

      {loading && (
        <div className="bg-card rounded-xl shadow-sm p-12 text-center">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      )}
    </div>
  );
}