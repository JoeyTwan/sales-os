"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Filter, Plus, X } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";

interface Contact {
  id: string;
  name: string;
  position: string;
  customer_id: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  customer_id: string;
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
  level: "HIGH" | "MEDIUM" | "LOW";
  status: "ACTIVE" | "FOLLOWING" | "PAUSED" | "LOST";
  summary: string;
  next_action: string;
  next_action_date: string;
  created_at: string;
  updated_at: string;
  contacts?: Contact[];
  projects?: Project[];
  ai_summary?: CustomerAISummary;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("");
  const [selectedStage, setSelectedStage] = useState<string>("");
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    contact_name: "",
    contact_position: "",
    summary: "",
    level: "MEDIUM" as Customer["level"],
    remark: "",
  });
  const [creating, setCreating] = useState(false);

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

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim()) return;
    setCreating(true);
    try {
      await apiPost("/api/customers", newCustomer);
      setShowModal(false);
      setNewCustomer({
        name: "",
        contact_name: "",
        contact_position: "",
        summary: "",
        level: "MEDIUM",
        remark: "",
      });
      loadCustomers();
    } catch {} finally {
      setCreating(false);
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

  const getStageClass = (stage: string) => {
    if (!stage) return "bg-muted/50 text-muted-foreground";
    if (stage.includes("线索")) return "bg-blue-500/10 text-blue-600";
    if (stage.includes("确认")) return "bg-green-500/10 text-green-600";
    if (stage.includes("方案")) return "bg-purple-500/10 text-purple-600";
    if (stage.includes("验证")) return "bg-cyan-500/10 text-cyan-600";
    if (stage.includes("谈判")) return "bg-orange-500/10 text-orange-600";
    if (stage.includes("成交")) return "bg-emerald-500/10 text-emerald-600";
    return "bg-muted/50 text-muted-foreground";
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
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };

  const filteredCustomers = useCallback(() => {
    let result = customers;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(query) ||
        (c.contacts && c.contacts.some(ct => ct.name.toLowerCase().includes(query))) ||
        (c.projects && c.projects.some(p => p.name.toLowerCase().includes(query))) ||
        (c.summary && c.summary.toLowerCase().includes(query))
      );
    }

    if (selectedLevel) {
      result = result.filter(c => c.level === selectedLevel);
    }

    if (selectedTimeRange) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (selectedTimeRange === "7days") {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        result = result.filter(c => {
          const createdAt = new Date(c.created_at);
          createdAt.setHours(0, 0, 0, 0);
          return createdAt >= sevenDaysAgo;
        });
      } else if (selectedTimeRange === "30days") {
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        result = result.filter(c => {
          const createdAt = new Date(c.created_at);
          createdAt.setHours(0, 0, 0, 0);
          return createdAt >= thirtyDaysAgo;
        });
      }
    }

    if (selectedStage) {
      result = result.filter(c => (c.ai_summary?.stage || "").includes(selectedStage));
    }

    return result;
  }, [customers, searchQuery, selectedLevel, selectedTimeRange, selectedStage]);

  const stages = ["线索", "需求确认", "方案设计", "技术验证", "商务谈判", "成交"];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowModal(false);
        setShowFilter(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">客户管理</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>新建客户</span>
        </button>
      </div>

      <div className="bg-card rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索公司名、联系人、项目、需求..."
              className="w-full bg-zinc-800 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              showFilter ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>筛选</span>
          </button>
        </div>

        {showFilter && (
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-2">优先级</label>
              <div className="flex gap-2">
                {["", "HIGH", "MEDIUM", "LOW"].map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      selectedLevel === level
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/30 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {level ? getLevelLabel(level as Customer["level"]) : "全部"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-2">时间</label>
              <div className="flex gap-2">
                {["", "7days", "30days"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedTimeRange(range)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      selectedTimeRange === range
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/30 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {range === "" ? "全部" : range === "7days" ? "近7天" : "近30天"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-2">阶段</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedStage("")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    selectedStage === ""
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/30 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  全部
                </button>
                {stages.map((stage) => (
                  <button
                    key={stage}
                    onClick={() => setSelectedStage(stage)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      selectedStage === stage
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/30 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <span className="text-muted-foreground">加载中...</span>
        </div>
      ) : filteredCustomers().length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCustomers().map((customer) => (
            <Link
              key={customer.id}
              href={`/customers/${customer.id}`}
              className="block bg-card rounded-xl shadow-sm p-5 hover:shadow-md hover:border-primary/20 transition-all border border-transparent"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold">{customer.name}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {customer.contacts && customer.contacts.length > 0 ? customer.contacts.map(c => c.name).join(", ") : "暂无联系人"}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelClass(customer.level)}`}>
                  {getLevelLabel(customer.level)}
                </span>
              </div>

              {customer.projects && customer.projects.length > 0 && (
                <div className="bg-muted/30 rounded-lg p-3 mb-3">
                  <p className="text-xs text-muted-foreground mb-1">项目</p>
                  <p className="text-sm font-medium text-foreground/90">{customer.projects[0].name}</p>
                </div>
              )}

              {(customer.summary || customer.ai_summary?.stage) && (
                <div className="mb-3">
                  {customer.summary && (
                    <div className="text-sm text-foreground/80 mb-2 line-clamp-2">
                      {customer.summary}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${getStageClass(customer.ai_summary?.stage || "")}`}>
                      {customer.ai_summary?.stage || "线索"}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">下一步：{customer.next_action || "暂无"}</span>
                <span className="text-xs text-muted-foreground">{formatDateTime(customer.updated_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-sm p-12 text-center">
          <p className="text-muted-foreground">暂无客户</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            新建客户
          </button>
        </div>
      )}

      {showModal && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold">新建客户</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-medium">公司名称</label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="输入公司名称"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2 font-medium">联系人</label>
                  <input
                    type="text"
                    value={newCustomer.contact_name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, contact_name: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-800 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2 font-medium">职位</label>
                  <input
                    type="text"
                    value={newCustomer.contact_position}
                    onChange={(e) => setNewCustomer({ ...newCustomer, contact_position: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-800 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="职位"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-medium">需求</label>
                <textarea
                  value={newCustomer.summary}
                  onChange={(e) => setNewCustomer({ ...newCustomer, summary: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all h-20 resize-none"
                  placeholder="输入客户需求"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-medium">客户价值</label>
                <div className="flex gap-4">
                  {(["HIGH", "MEDIUM", "LOW"] as const).map((level) => (
                    <label key={level} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={newCustomer.level === level}
                        onChange={() => setNewCustomer({ ...newCustomer, level })}
                        className="w-4 h-4 text-primary border-border"
                      />
                      <span className="text-sm">{getLevelLabel(level)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-medium">备注</label>
                <textarea
                  value={newCustomer.remark}
                  onChange={(e) => setNewCustomer({ ...newCustomer, remark: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all h-16 resize-none"
                  placeholder="输入备注信息（可选）"
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
                onClick={handleCreateCustomer}
                disabled={!newCustomer.name.trim() || creating}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {creating ? "创建中..." : "创建客户"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}