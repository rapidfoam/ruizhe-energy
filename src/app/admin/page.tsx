"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Stats {
  totalAssessments: number;
  registeredUsers: number;
  todayAssessments: number;
  ratingDistribution: { rating: string; count: number }[];
  averageScore: number;
  overproofRates: {
    wall: number;
    roof: number;
    window: number;
  };
}

interface Assessment {
  id: number;
  session_id: string;
  created_at: string;
  city: string;
  climate_zone: string;
  building_type: string;
  wall_k_value: number;
  wall_standard_limit: number;
  wall_compliant: boolean;
  roof_k_value: number;
  roof_standard_limit: number;
  roof_compliant: boolean;
  window_k_value: number;
  window_standard_limit: number;
  window_compliant: boolean;
  overall_rating: string;
  overall_score: number;
  phone: string;
}

interface RegisteredUser {
  phone: string;
  registered_at: string;
  last_assessment_at: string;
  assessment_count: number;
  latest_rating: string;
}

type TabType = "dashboard" | "assessments" | "users";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterRating, setFilterRating] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  useEffect(() => {
    fetchData();
  }, [activeTab, page, filterRating, filterStartDate, filterEndDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "dashboard") {
        const res = await fetch("/api/assessments/stats");
        const data = await res.json();
        if (data.success) {
          setStats(data.data.stats);
          setRegisteredUsers(data.data.registeredUsers);
        }
      } else if (activeTab === "assessments") {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: "20",
        });
        if (filterRating) params.append("rating", filterRating);
        if (filterStartDate) params.append("startDate", filterStartDate);
        if (filterEndDate) params.append("endDate", filterEndDate);
        
        const res = await fetch(`/api/assessments?${params}`);
        const data = await res.json();
        if (data.success) {
          setAssessments(data.data);
          setTotalPages(data.totalPages);
        }
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = (data: unknown[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0] as object);
    const csv = [
      headers.join(","),
      ...data.map(row => 
        headers.map(h => {
          const val = (row as Record<string, unknown>)[h];
          return typeof val === "string" && val.includes(",") ? `"${val}"` : val;
        }).join(",")
      ),
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const ratingColors: Record<string, string> = {
    A: "bg-emerald-500",
    B: "bg-blue-500",
    C: "bg-amber-500",
    D: "bg-orange-500",
    E: "bg-red-500",
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-8" />
            <h1 className="text-lg font-bold">管理后台</h1>
          </div>
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-200">
            返回首页
          </Link>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-800/50 border-b border-slate-700 px-4">
        <div className="max-w-7xl mx-auto flex gap-1">
          {[
            { id: "dashboard" as TabType, label: "仪表盘" },
            { id: "assessments" as TabType, label: "评估记录" },
            { id: "users" as TabType, label: "注册用户" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Dashboard */}
            {activeTab === "dashboard" && stats && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard title="总评估次数" value={stats.totalAssessments} />
                  <StatCard title="注册用户数" value={stats.registeredUsers} />
                  <StatCard title="今日新增" value={stats.todayAssessments} />
                  <StatCard title="平均评分" value={stats.averageScore.toFixed(1)} />
                </div>

                {/* Rating Distribution */}
                <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                  <h3 className="text-sm font-medium text-slate-400 mb-4">评级分布</h3>
                  <div className="flex items-end gap-2 h-32">
                    {["A", "B", "C", "D", "E"].map(rating => {
                      const dist = stats.ratingDistribution.find(d => d.rating === rating);
                      const count = dist?.count || 0;
                      const maxCount = Math.max(...stats.ratingDistribution.map(d => d.count), 1);
                      const height = (count / maxCount) * 100;
                      return (
                        <div key={rating} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs text-slate-400">{count}</span>
                          <div
                            className={`w-full rounded-t ${ratingColors[rating]}`}
                            style={{ height: `${Math.max(height, 4)}%` }}
                          />
                          <span className="text-sm font-medium">{rating}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Overproof Rates */}
                <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                  <h3 className="text-sm font-medium text-slate-400 mb-4">超标率</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <OverproofCard label="外墙" rate={stats.overproofRates.wall} />
                    <OverproofCard label="屋面" rate={stats.overproofRates.roof} />
                    <OverproofCard label="外窗" rate={stats.overproofRates.window} />
                  </div>
                </div>
              </div>
            )}

            {/* Assessments */}
            {activeTab === "assessments" && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-3 items-center">
                  <select
                    value={filterRating}
                    onChange={e => { setFilterRating(e.target.value); setPage(1); }}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
                  >
                    <option value="">全部评级</option>
                    {["A", "B", "C", "D", "E"].map(r => (
                      <option key={r} value={r}>{r}级</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={e => { setFilterStartDate(e.target.value); setPage(1); }}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
                    placeholder="开始日期"
                  />
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={e => { setFilterEndDate(e.target.value); setPage(1); }}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
                    placeholder="结束日期"
                  />
                  <button
                    onClick={() => exportCSV(assessments, `assessments_${new Date().toISOString().split("T")[0]}.csv`)}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg"
                  >
                    导出CSV
                  </button>
                </div>

                {/* Table */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-slate-400">时间</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-slate-400">城市</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-slate-400">建筑类型</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-slate-400">外墙K</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-slate-400">屋面K</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-slate-400">外窗K</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-slate-400">评级</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-slate-400">评分</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-slate-400">手机号</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {assessments.map(a => (
                        <tr key={a.id} className="hover:bg-slate-700/30">
                          <td className="px-3 py-2 text-xs text-slate-400">
                            {new Date(a.created_at).toLocaleString("zh-CN")}
                          </td>
                          <td className="px-3 py-2">{a.city}</td>
                          <td className="px-3 py-2 text-xs">{a.building_type}</td>
                          <td className="px-3 py-2">
                            <span className={a.wall_compliant ? "text-emerald-400" : "text-red-400"}>
                              {a.wall_k_value?.toFixed(2) || "-"}
                            </span>
                            <span className="text-slate-500 text-xs">/{a.wall_standard_limit}</span>
                          </td>
                          <td className="px-3 py-2">
                            <span className={a.roof_compliant ? "text-emerald-400" : "text-red-400"}>
                              {a.roof_k_value?.toFixed(2) || "-"}
                            </span>
                            <span className="text-slate-500 text-xs">/{a.roof_standard_limit}</span>
                          </td>
                          <td className="px-3 py-2">
                            <span className={a.window_compliant ? "text-emerald-400" : "text-red-400"}>
                              {a.window_k_value?.toFixed(2) || "-"}
                            </span>
                            <span className="text-slate-500 text-xs">/{a.window_standard_limit}</span>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${ratingColors[a.overall_rating]}`}>
                              {a.overall_rating}
                            </span>
                          </td>
                          <td className="px-3 py-2">{a.overall_score?.toFixed(0) || "-"}</td>
                          <td className="px-3 py-2 text-xs text-slate-400">{a.phone || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-sm disabled:opacity-50"
                    >
                      上一页
                    </button>
                    <span className="px-3 py-1 text-sm text-slate-400">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-sm disabled:opacity-50"
                    >
                      下一页
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Users */}
            {activeTab === "users" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium">注册用户列表</h2>
                  <button
                    onClick={() => exportCSV(registeredUsers, `users_${new Date().toISOString().split("T")[0]}.csv`)}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg"
                  >
                    导出CSV
                  </button>
                </div>

                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">手机号</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">注册时间</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">最近评估</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">评估次数</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">最新评级</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {registeredUsers.map(u => (
                        <tr key={u.phone} className="hover:bg-slate-700/30">
                          <td className="px-4 py-3 font-mono">{u.phone}</td>
                          <td className="px-4 py-3 text-xs text-slate-400">
                            {new Date(u.registered_at).toLocaleString("zh-CN")}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">
                            {new Date(u.last_assessment_at).toLocaleString("zh-CN")}
                          </td>
                          <td className="px-4 py-3">{u.assessment_count}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${ratingColors[u.latest_rating]}`}>
                              {u.latest_rating}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {registeredUsers.length === 0 && (
                  <div className="text-center py-10 text-slate-500">
                    暂无注册用户
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <p className="text-xs text-slate-400 mb-1">{title}</p>
      <p className="text-2xl font-bold text-slate-100">{value}</p>
    </div>
  );
}

function OverproofCard({ label, rate }: { label: string; rate: number }) {
  const color = rate > 50 ? "text-red-400" : rate > 30 ? "text-amber-400" : "text-emerald-400";
  return (
    <div className="text-center">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{rate.toFixed(1)}%</p>
    </div>
  );
}
