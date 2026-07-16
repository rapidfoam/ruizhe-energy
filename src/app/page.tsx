"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const REFERRAL_KEY = "ruizhu_referral_source";
const REFERRAL_TIME_KEY = "ruizhu_referral_time";
const REFERRAL_EXPIRY_DAYS = 7;

function getReferralSource(): string | null {
  if (typeof window === "undefined") return null;
  const source = localStorage.getItem(REFERRAL_KEY);
  const timeStr = localStorage.getItem(REFERRAL_TIME_KEY);
  if (!source || !timeStr) return null;
  const time = parseInt(timeStr, 10);
  if (isNaN(time)) return null;
  const now = Date.now();
  const expiryMs = REFERRAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  if (now - time > expiryMs) {
    localStorage.removeItem(REFERRAL_KEY);
    localStorage.removeItem(REFERRAL_TIME_KEY);
    return null;
  }
  return source;
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 检查 URL 参数 ?from=xxx
    const params = new URLSearchParams(window.location.search);
    const fromParam = params.get("from");
    if (fromParam) {
      // 只在没有有效来源时才写入（首次来源优先）
      const existing = getReferralSource();
      if (!existing) {
        localStorage.setItem(REFERRAL_KEY, fromParam);
        localStorage.setItem(REFERRAL_TIME_KEY, Date.now().toString());
      }
    }
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-blue-50/30">
      {/* 顶部标题区 */}
      <header className="pt-12 pb-8 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-[#1A3A5C] mb-3 tracking-tight">
          睿筑·建筑评估
        </h1>
        <p className="text-lg md:text-xl text-slate-600 mb-2">
          每栋房子都值得被评估
        </p>
        <p className="text-sm text-slate-500">
          依据国家标准 · 免费评估 · 3分钟出结果
        </p>
      </header>

      {/* 工具卡片区 */}
      <main className="flex-1 px-4 pb-8 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 筑能卡片 */}
          <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100 overflow-hidden">
            <div className="p-8">
              {/* 图标 */}
              <div className="text-5xl mb-4">🏠</div>

              {/* 标题 */}
              <h2 className="text-2xl font-bold text-[#1A3A5C] mb-2">
                筑能 · 建筑节能评估
              </h2>

              {/* 描述 */}
              <p className="text-slate-600 mb-4">
                3分钟评估你的房子保温达标吗
              </p>

              {/* 依据 */}
              <p className="text-xs text-slate-500 mb-6 font-mono">
                依据：GB 55015-2021
              </p>

              {/* 标签 */}
              <div className="flex gap-2 mb-6">
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
                  免费
                </span>
                <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-medium">
                  3分钟
                </span>
                <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-medium">
                  国标对标
                </span>
              </div>

              {/* 按钮组 */}
              <div className="flex gap-3">
                <Link
                  href="/chat-assess"
                  className="flex-1 text-center py-3 rounded-xl bg-[#1A3A5C] text-white font-medium hover:bg-[#244a70] transition-colors"
                >
                  💬 智能评估
                </Link>
                <Link
                  href="/form"
                  className="flex-1 text-center py-3 rounded-xl border-2 border-[#1A3A5C] text-[#1A3A5C] font-medium hover:bg-slate-50 transition-colors"
                >
                  手动填写
                </Link>
              </div>
            </div>
          </div>

          {/* 筑静卡片 */}
          <div className="relative bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden opacity-90">
            {/* 即将上线角标 */}
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
              即将上线
            </div>

            <div className="p-8">
              {/* 图标 */}
              <div className="text-5xl mb-4">🔇</div>

              {/* 标题 */}
              <h2 className="text-2xl font-bold text-[#1A3A5C] mb-2">
                筑静 · 建筑隔音评估
              </h2>

              {/* 描述 */}
              <p className="text-slate-600 mb-4">
                3分钟评估你的房子隔音达标吗
              </p>

              {/* 依据 */}
              <p className="text-xs text-slate-500 mb-6 font-mono">
                依据：GB 50118-2010
              </p>

              {/* 标签 */}
              <div className="flex gap-2 mb-6">
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
                  免费
                </span>
                <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-medium">
                  3分钟
                </span>
                <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-medium">
                  国标对标
                </span>
              </div>

              {/* 按钮 */}
              <button
                disabled
                className="w-full py-3 rounded-xl bg-slate-200 text-slate-500 font-medium cursor-not-allowed"
              >
                即将上线
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 底部 */}
      <footer className="pb-8 pt-4 px-4 text-center">
        <Link
          href="/certify"
          className="inline-flex items-center gap-1 text-sm text-[#1A3A5C] hover:text-blue-600 transition-colors mb-4"
        >
          评估达标？申请睿筑官方认证
          <span>→</span>
        </Link>
        <p className="text-xs text-slate-400">
          © 2026 睿筑·建筑评估
        </p>
      </footer>
    </div>
  );
}
