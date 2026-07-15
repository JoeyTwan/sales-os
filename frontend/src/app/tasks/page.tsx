"use client";

import { useState, useEffect } from "react";
import { List, Calendar, Plus, Check, X, Clock, AlertCircle, ChevronRight } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "DOING" | "DONE";
  priority: "HIGH" | "MEDIUM" | "LOW";
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

type ViewMode = "list" | "calendar";

interface GroupedTasks {
  today: Task[];
  thisWeek: Task[];
  future: Task[];
  noDate: Task[];
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as Task["priority"],
    due_date: "",
  });

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await fetch("/api/tasks");
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch {}
  };

  const handleComplete = async (task: Task) => {
    const newStatus = task.status === "DONE" ? "TODO" : "DONE";
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      loadTasks();
    } catch {}
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTask.title.trim(),
          description: newTask.description.trim() || null,
          priority: newTask.priority,
          due_date: newTask.due_date || null,
        }),
      });
      setShowModal(false);
      setNewTask({ title: "", description: "", priority: "MEDIUM", due_date: "" });
      loadTasks();
    } catch {}
  };

  const groupTasks = (): GroupedTasks => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + (7 - today.getDay()));
    weekEnd.setHours(23, 59, 59, 999);

    return tasks.reduce(
      (acc, task) => {
        if (!task.due_date) {
          acc.noDate.push(task);
          return acc;
        }

        const dueDate = new Date(task.due_date);
        dueDate.setHours(0, 0, 0, 0);

        if (dueDate.getTime() === today.getTime()) {
          acc.today.push(task);
        } else if (dueDate <= weekEnd) {
          acc.thisWeek.push(task);
        } else {
          acc.future.push(task);
        }

        return acc;
      },
      { today: [], thisWeek: [], future: [], noDate: [] } as GroupedTasks
    );
  };

  const getPriorityClass = (priority: Task["priority"]) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-500/10 text-red-600";
      case "MEDIUM":
        return "bg-yellow-500/10 text-yellow-700";
      case "LOW":
        return "bg-gray-500/10 text-gray-600";
    }
  };

  const getPriorityLabel = (priority: Task["priority"]) => {
    switch (priority) {
      case "HIGH":
        return "高";
      case "MEDIUM":
        return "中";
      case "LOW":
        return "低";
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dateStr);
    taskDate.setHours(0, 0, 0, 0);

    if (taskDate.getTime() === today.getTime()) {
      return "今天";
    }

    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };

  const grouped = groupTasks();

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  const getCalendarDays = () => {
    const today = new Date();
    const firstDay = new Date(today);
    firstDay.setDate(today.getDate() - today.getDay());

    const days: { date: Date; isToday: boolean; tasks: Task[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(firstDay);
      date.setDate(firstDay.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const dayTasks = tasks.filter((task) => {
        if (!task.due_date) return false;
        const dueDate = new Date(task.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === date.getTime();
      });

      days.push({
        date,
        isToday: date.getTime() === today.setHours(0, 0, 0, 0),
        tasks: dayTasks,
      });
    }
    return days;
  };

  const calendarDays = getCalendarDays();

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">任务管理</h1>
          <p className="text-sm text-muted-foreground mt-1">共 {tasks.length} 个任务</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "list" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "calendar" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>新建任务</span>
          </button>
        </div>
      </div>

      {viewMode === "list" && (
        <div className="space-y-6">
          {grouped.today.length > 0 && (
            <div className="bg-card rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-muted-foreground">今日任务</h2>
                <span className="text-xs text-muted-foreground ml-2">{grouped.today.length} 项</span>
              </div>
              <div className="space-y-3">
                {grouped.today.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-4 p-3 rounded-lg transition-colors ${
                      task.status === "DONE" ? "bg-muted/50 opacity-60" : "hover:bg-muted/30"
                    }`}
                  >
                    <button
                      onClick={() => handleComplete(task)}
                      className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        task.status === "DONE"
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {task.status === "DONE" && <Check className="w-3 h-3" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${task.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{task.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityClass(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(task.due_date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {grouped.thisWeek.length > 0 && (
            <div className="bg-card rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-semibold text-muted-foreground">本周任务</h2>
                <span className="text-xs text-muted-foreground ml-2">{grouped.thisWeek.length} 项</span>
              </div>
              <div className="space-y-3">
                {grouped.thisWeek.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-4 p-3 rounded-lg transition-colors ${
                      task.status === "DONE" ? "bg-muted/50 opacity-60" : "hover:bg-muted/30"
                    }`}
                  >
                    <button
                      onClick={() => handleComplete(task)}
                      className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        task.status === "DONE"
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {task.status === "DONE" && <Check className="w-3 h-3" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${task.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{task.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityClass(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(task.due_date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {grouped.future.length > 0 && (
            <div className="bg-card rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <ChevronRight className="w-4 h-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-muted-foreground">未来任务</h2>
                <span className="text-xs text-muted-foreground ml-2">{grouped.future.length} 项</span>
              </div>
              <div className="space-y-3">
                {grouped.future.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-4 p-3 rounded-lg transition-colors ${
                      task.status === "DONE" ? "bg-muted/50 opacity-60" : "hover:bg-muted/30"
                    }`}
                  >
                    <button
                      onClick={() => handleComplete(task)}
                      className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        task.status === "DONE"
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {task.status === "DONE" && <Check className="w-3 h-3" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${task.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{task.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityClass(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(task.due_date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {grouped.noDate.length > 0 && (
            <div className="bg-card rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-muted-foreground">无截止日期</h2>
                <span className="text-xs text-muted-foreground ml-2">{grouped.noDate.length} 项</span>
              </div>
              <div className="space-y-3">
                {grouped.noDate.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-4 p-3 rounded-lg transition-colors ${
                      task.status === "DONE" ? "bg-muted/50 opacity-60" : "hover:bg-muted/30"
                    }`}
                  >
                    <button
                      onClick={() => handleComplete(task)}
                      className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        task.status === "DONE"
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {task.status === "DONE" && <Check className="w-3 h-3" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${task.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{task.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityClass(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tasks.length === 0 && (
            <div className="bg-card rounded-xl shadow-sm p-12 text-center">
              <p className="text-muted-foreground">暂无任务</p>
              <p className="text-sm text-muted-foreground mt-2">点击右上角新建任务</p>
            </div>
          )}
        </div>
      )}

      {viewMode === "calendar" && (
        <div className="bg-card rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) => (
              <div
                key={day.date.toDateString()}
                className={`aspect-square rounded-lg p-2 flex flex-col transition-colors ${
                  day.isToday ? "bg-primary/10" : "hover:bg-muted/30"
                }`}
              >
                <span
                  className={`text-xs font-medium ${
                    day.isToday ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {day.date.getDate()}
                </span>
                <div className="flex-1 mt-1 flex flex-col gap-1 overflow-hidden">
                  {day.tasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleComplete(task)}
                      className={`text-xs px-1.5 py-0.5 rounded truncate cursor-pointer transition-colors ${
                        task.status === "DONE"
                          ? "bg-green-500/10 text-green-600 line-through"
                          : getPriorityClass(task.priority)
                      }`}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ))}
                  {day.tasks.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{day.tasks.length - 3}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl shadow-lg w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">新建任务</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">任务标题</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full bg-transparent border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="输入任务标题..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">任务描述</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full bg-transparent border border-border rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="输入任务描述..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">优先级</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task["priority"] })}
                    className="w-full bg-transparent border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="HIGH">高</option>
                    <option value="MEDIUM">中</option>
                    <option value="LOW">低</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">截止日期</label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full bg-transparent border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!newTask.title.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
