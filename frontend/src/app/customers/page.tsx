"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch {}
  };

  const getLevelClass = (level: Customer["level"]) => {
    switch (level) {
      case "HIGH":
        return "bg-red-500/10 text-red-600";
      case "MEDIUM":
        return "bg-yellow-500/10 text-yellow-700";
      case "LOW":
        return "bg-gray-500/10 text-gray-600";
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

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">客户管理</h1>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
          新建客户
        </button>
      </div>

      {customers.length > 0 ? (
        <div className="bg-card rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30">
                <th className="text-left py-4 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  客户名称
                </th>
                <th className="text-left py-4 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  客户等级
                </th>
                <th className="text-left py-4 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  客户状态
                </th>
                <th className="text-left py-4 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  下一步动作
                </th>
                <th className="text-left py-4 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  下次跟进
                </th>
                <th className="text-left py-4 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  最近更新
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/customers/${customer.id}`}
                  className="block hover:bg-muted/20 transition-colors"
                >
                  <tr>
                    <td className="py-4 px-6">
                      <span className="text-lg font-medium">{customer.name}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getLevelClass(customer.level)}`}>
                        {getLevelLabel(customer.level)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-muted-foreground">{getStatusLabel(customer.status)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-muted-foreground truncate max-w-xs">
                        {customer.next_action || "-"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-muted-foreground">{formatDate(customer.next_action_date) || "-"}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-muted-foreground">{formatDateTime(customer.updated_at)}</span>
                    </td>
                  </tr>
                </Link>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-sm p-12 text-center">
          <p className="text-muted-foreground">暂无客户</p>
        </div>
      )}
    </div>
  );
}
