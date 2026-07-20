"use client";

import { useState, useEffect } from "react";
import { List, Calendar, Plus, Check, X, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { apiGet, apiPatch, apiPost } from "@/lib/api";

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
  done: Task[];
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as Task["priority"],
    due_date: "",
  });

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const loadTasks = async () => {
    try {
      const data = await apiGet<Task[]>("/api/tasks");
      setTasks(data);
    } catch {}
  };

  const handleComplete = async (task: Task) => {
    const newStatus = task.status === "DONE" ? "TODO" : "DONE";
    try {
      await apiPatch(`/api/tasks/${task.id}`, { status: newStatus });
      loadTasks();
    } catch {}
  };

  const handleStatusChange = async (task: Task, status: Task["status"]) => {
    try {
      await apiPatch(`/api/tasks/${task.id}`, { status });
      loadTasks();
    } catch {}
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      await apiPost("/api/tasks", {
        title: newTask.title.trim(),
        description: newTask.description.trim() || null,
        priority: newTask.priority,
        due_date: newTask.due_date || null,
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
        if (task.status === "DONE") {
          acc.done.push(task);
          return acc;
        }

        if (!task.due_date) {
          acc.future.push(task);
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
      { today: [], thisWeek: [], future: [], done: [] } as GroupedTasks
    );
  };

  const getPriorityClass = (priority: Task["priority"]) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-500/10 text-red-600";
      case "MEDIUM":
        return "bg-yellow-500/10 text-yellow-700";
      case "LOW":
        return "bg-muted/50 text-muted-foreground";
    }
  };

  const getPriorityLabel = (priority: Task["priority"]) => {
    switch (priority) {
      case "HIGH":
        return "紧急且重要";
      case "MEDIUM":
        return "重要不紧急";
      case "LOW":
        return "一般";
    }
  };

  const getPriorityColorClass = (priority: Task["priority"]) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-500";
      case "MEDIUM":
        return "bg-orange-500";
      case "LOW":
        return "bg-gray-500";
    }
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

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString("zh-CN", { year: "numeric", month: "long" });
  };

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: { date: Date; isToday: boolean; isSelected: boolean; tasks: Task[]; isCurrentMonth: boolean }[] = [];

    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        isToday: false,
        isSelected: false,
        tasks: [],
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      date.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dayTasks = tasks.filter((task) => {
        if (!task.due_date) return false;
        const dueDate = new Date(task.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === date.getTime();
      });

      days.push({
        date,
        isToday: date.getTime() === today.getTime(),
        isSelected: selectedDate?.getTime() === date.getTime(),
        tasks: dayTasks,
        isCurrentMonth: true,
      });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isToday: false,
        isSelected: false,
        tasks: [],
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const calendarDays = getCalendarDays();
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  const getSelectedDateTasks = () => {
    if (!selectedDate) return [];
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return tasks.filter((task) => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === selected.getTime();
    });
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(null);
  };

  const selectedTasks = getSelectedDateTasks();

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">任务中心</h1>
          <p className="text-sm text-muted-foreground mt-1">共 {tasks.length} 个任务</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-card rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              列表
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "calendar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              日历
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
                <h2 className="text-sm font-semibold text-muted-foreground">今天</h2>
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
                      {task.due_date && (
                        <div className="flex items-center gap-1 mt-2">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{formatDate(task.due_date)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task, e.target.value as Task["status"])}
                        className="text-xs bg-transparent border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/20"
                      >
                        <option value="TODO">待办</option>
                        <option value="DOING">进行中</option>
                        <option value="DONE">已完成</option>
                      </select>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityClass(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
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
                <h2 className="text-sm font-semibold text-muted-foreground">本周</h2>
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
                      {task.due_date && (
                        <div className="flex items-center gap-1 mt-2">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{formatDate(task.due_date)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task, e.target.value as Task["status"])}
                        className="text-xs bg-transparent border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/20"
                      >
                        <option value="TODO">待办</option>
                        <option value="DOING">进行中</option>
                        <option value="DONE">已完成</option>
                      </select>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityClass(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {grouped.future.length > 0 && (
            <div className="bg-card rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-muted-foreground">未来</h2>
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
                      {task.due_date && (
                        <div className="flex items-center gap-1 mt-2">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{formatDate(task.due_date)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task, e.target.value as Task["status"])}
                        className="text-xs bg-transparent border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/20"
                      >
                        <option value="TODO">待办</option>
                        <option value="DOING">进行中</option>
                        <option value="DONE">已完成</option>
                      </select>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityClass(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {grouped.done.length > 0 && (
            <div className="bg-card rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Check className="w-4 h-4 text-green-500" />
                <h2 className="text-sm font-semibold text-muted-foreground">已完成</h2>
                <span className="text-xs text-muted-foreground ml-2">{grouped.done.length} 项</span>
              </div>
              <div className="space-y-3">
                {grouped.done.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-4 p-3 rounded-lg bg-muted/50 opacity-60"
                  >
                    <button
                      onClick={() => handleComplete(task)}
                      className="mt-1 w-5 h-5 rounded-full border-2 bg-green-500 border-green-500 text-white flex items-center justify-center transition-colors"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-through text-muted-foreground">{task.title}</p>
                      {task.due_date && (
                        <div className="flex items-center gap-1 mt-2">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{formatDate(task.due_date)}</span>
                        </div>
                      )}
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
        <div className="space-y-6 overflow-x-hidden">
          <div className="bg-card rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold">{getMonthName(currentMonth)}</h2>
                <button
                  onClick={goToToday}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  今天
                </button>
              </div>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((day) => (
                <div
                  key={day.date.toDateString()}
                  onClick={() => setSelectedDate(day.isCurrentMonth ? day.date : null)}
                  className={`aspect-square rounded-lg p-1.5 flex flex-col transition-colors cursor-pointer ${
                    day.isSelected
                      ? "bg-primary text-primary-foreground"
                      : day.isToday
                      ? "bg-blue-500/20"
                      : day.isCurrentMonth
                      ? "hover:bg-muted/30"
                      : "bg-muted/10 text-muted-foreground/50"
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${
                      day.isSelected ? "text-primary-foreground" : day.isToday ? "text-blue-500 font-semibold" : ""
                    }`}
                  >
                    {day.date.getDate()}
                  </span>
                  <div className="flex-1 mt-1 flex flex-col gap-0.5 overflow-hidden">
                    {day.tasks.slice(0, 2).map((task) => (
                      <div
                        key={task.id}
                        className={`h-2 rounded-full ${
                          task.status === "DONE" ? "bg-green-500/50" : getPriorityClass(task.priority).split(" ")[0]
                        }`}
                        title={task.title}
                      />
                    ))}
                    {day.tasks.length > 2 && (
                      <span className="text-[10px] opacity-60">+{day.tasks.length - 2}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedDate && (
            <div className="bg-card rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-muted-foreground">
                  {selectedDate.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" })}
                </h2>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  关闭
                </button>
              </div>
              {selectedTasks.length > 0 ? (
                <div className="space-y-3">
                  {selectedTasks.map((task) => (
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
                          <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
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
              ) : (
                <p className="text-sm text-muted-foreground">当天没有任务</p>
              )}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
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

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">优先级</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "HIGH", label: "紧急且重要", color: "bg-red-500/10 text-red-600 border-red-500/30" },
                      { value: "MEDIUM", label: "重要不紧急", color: "bg-orange-500/10 text-orange-600 border-orange-500/30" },
                      { value: "LOW", label: "一般", color: "bg-gray-500/10 text-gray-600 border-gray-500/30" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setNewTask({ ...newTask, priority: option.value as Task["priority"] })}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                          newTask.priority === option.value
                            ? `${option.color} ring-2 ring-offset-2 ring-primary/20`
                            : "bg-muted/20 text-muted-foreground border-transparent hover:bg-muted/40"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">截止日期</label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full bg-zinc-800 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
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
