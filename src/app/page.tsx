"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <div className="animate-fade-in mb-6">
        <img src="/logo.svg" alt="睿筑建筑节能评估" className="h-16 w-auto" />
      </div>

      {/* Header badge */}
      <div className="animate-fade-in mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          GB 50176 / JGJ 26 标准
        </div>
      </div>

      {/* Main title */}
      <h1 className="animate-fade-in text-3xl font-bold text-center mb-3 tracking-tight">
        <span className="text-slate-100">睿筑</span>
        <span className="text-blue-400">建筑节能评估</span>
      </h1>

      <p className="animate-fade-in text-slate-400 text-sm text-center max-w-xs mb-8 leading-relaxed">
        基于围护结构传热系数K值计算，自动对比国家节能标准限值，生成专业评估报告
      </p>

      {/* Feature list */}
      <div className="animate-fade-in w-full max-w-sm mb-8 space-y-3">
        {[
          { icon: "01", text: "城市气候分区自动匹配" },
          { icon: "02", text: "K值精确计算引擎" },
          { icon: "03", text: "逐项达标判定分析" },
          { icon: "04", text: "热损失分布估算" },
          { icon: "05", text: "综合评级与详细报告" },
        ].map((item) => (
          <div
            key={item.icon}
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800/60 border border-slate-700/50"
          >
            <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
              {item.icon}
            </span>
            <span className="text-sm text-slate-300">{item.text}</span>
          </div>
        ))}
      </div>

      {/* CTA button */}
      <Link
        href="/form"
        className="animate-fade-in w-full max-w-sm block text-center px-6 py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-medium rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
      >
        开始评估
      </Link>

      {/* Footer */}
      <div className="animate-fade-in mt-12 text-center">
        <p className="text-xs text-slate-500">
          评估依据: GB 50176-2016 / JGJ 26-2018 / GB 50189-2015
        </p>
        <p className="text-xs text-slate-600 mt-1">
          仅供参考，不作为正式设计依据
        </p>
      </div>
    </div>
  );
}
