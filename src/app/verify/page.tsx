"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Mock证书数据（MVP阶段，后续接飞书API）
const MOCK_CERTIFICATES: Record<string, {
  id: string;
  type: string;
  typeName: string;
  address: string;
  issueDate: string;
  wallK: number;
  roofK: number;
  windowK: number;
  score: number;
}> = {
  "RZ-NE-2026-10001": {
    id: "RZ-NE-2026-10001",
    type: "energy",
    typeName: "筑能·建筑节能认证",
    address: "上海市浦东新区张江高科技园区XX小区3栋502室",
    issueDate: "2026-07-10",
    wallK: 0.48,
    roofK: 0.35,
    windowK: 2.2,
    score: 95,
  },
  "RZ-NE-2026-10002": {
    id: "RZ-NE-2026-10002",
    type: "energy",
    typeName: "筑能·建筑节能认证",
    address: "北京市朝阳区望京SOHO T1-1205",
    issueDate: "2026-07-08",
    wallK: 0.52,
    roofK: 0.38,
    windowK: 2.5,
    score: 92,
  },
  "RZ-AC-2026-10001": {
    id: "RZ-AC-2026-10001",
    type: "acoustic",
    typeName: "筑静·建筑隔音认证",
    address: "广州市天河区珠江新城XX花园8栋1201",
    issueDate: "2026-07-05",
    wallK: 0,
    roofK: 0,
    windowK: 0,
    score: 88,
  },
};

type QueryState = 'idle' | 'valid' | 'invalid';

export default function VerifyPage() {
  const router = useRouter();
  const [certId, setCertId] = useState("");
  const [queryState, setQueryState] = useState<QueryState>('idle');
  const [result, setResult] = useState<typeof MOCK_CERTIFICATES[string] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setQueryState('idle');

    // 模拟API查询延迟
    setTimeout(() => {
      const cert = MOCK_CERTIFICATES[certId.trim()];
      if (cert) {
        setResult(cert);
        setQueryState('valid');
      } else {
        setQueryState('invalid');
      }
      setLoading(false);
    }, 800);
  };

  // 编号格式校验
  const isValidFormat = /^RZ-(NE|AC)-\d{4}-\d{5}$/.test(certId);

  return (
    <div className="min-h-screen bg-slate-900 p-4 pb-8">
      <div className="max-w-lg mx-auto">
        {/* 头部 */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔍</div>
          <h1 className="text-2xl font-bold text-slate-100 mb-1">睿筑认证查询</h1>
          <p className="text-xs text-slate-500">输入证书编号，验证认证真伪</p>
        </div>

        {/* 查询表单 */}
        <form onSubmit={handleVerify} className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="RZ-NE-2026-XXXXX"
              value={certId}
              onChange={(e) => setCertId(e.target.value.toUpperCase())}
              className={`w-full px-4 py-3 pr-24 rounded-xl bg-slate-800 border text-slate-200 text-sm placeholder-slate-600 focus:outline-none transition-colors ${
                certId && !isValidFormat
                  ? 'border-red-500/50 focus:border-red-500'
                  : 'border-slate-700 focus:border-blue-500'
              }`}
            />
            <button
              type="submit"
              disabled={!certId || !isValidFormat || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-medium transition-colors"
            >
              {loading ? '查询中...' : '验证'}
            </button>
          </div>
          {certId && !isValidFormat && (
            <p className="mt-2 text-xs text-red-400">
              格式错误，正确格式：RZ-NE-2026-XXXXX 或 RZ-AC-2026-XXXXX
            </p>
          )}
        </form>

        {/* 查询结果 */}
        {queryState === 'valid' && result && (
          <div className="rounded-xl bg-emerald-900/20 border border-emerald-700/30 p-5 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">✅</span>
              <div>
                <h2 className="text-sm font-bold text-emerald-400">认证有效</h2>
                <p className="text-xs text-slate-500">该证书真实有效</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-500">证书编号</span>
                <span className="text-slate-200 font-mono">{result.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-500">认证名称</span>
                <span className="text-slate-200">{result.typeName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-500">房屋地址</span>
                <span className="text-slate-200 text-right max-w-[60%]">{result.address}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-500">颁发日期</span>
                <span className="text-slate-200">{result.issueDate}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-500">综合评分</span>
                <span className="text-amber-400 font-bold">{result.score}分</span>
              </div>

              {result.type === 'energy' && (
                <div className="pt-2">
                  <p className="text-slate-500 mb-2">评估数据摘要</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded bg-slate-800/50 text-center">
                      <p className="text-slate-500 text-[10px]">外墙K值</p>
                      <p className="text-slate-200 font-mono text-xs">{result.wallK}</p>
                    </div>
                    <div className="p-2 rounded bg-slate-800/50 text-center">
                      <p className="text-slate-500 text-[10px]">屋面K值</p>
                      <p className="text-slate-200 font-mono text-xs">{result.roofK}</p>
                    </div>
                    <div className="p-2 rounded bg-slate-800/50 text-center">
                      <p className="text-slate-500 text-[10px]">外窗K值</p>
                      <p className="text-slate-200 font-mono text-xs">{result.windowK}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700/50 text-center">
              <p className="text-[10px] text-slate-600">
                认证依据：GB 55015-2021《建筑节能与可再生能源利用通用规范》
              </p>
            </div>
          </div>
        )}

        {queryState === 'invalid' && (
          <div className="rounded-xl bg-red-900/20 border border-red-700/30 p-5 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl"></span>
              <div>
                <h2 className="text-sm font-bold text-red-400">未查询到该证书</h2>
                <p className="text-xs text-slate-500">请核对编号后重试</p>
              </div>
            </div>
          </div>
        )}

        {queryState === 'idle' && !loading && (
          <div className="text-center py-8">
            <p className="text-xs text-slate-600">
              输入证书编号，验证认证真伪
            </p>
            <p className="text-[10px] text-slate-700 mt-2">
              证书编号格式：RZ-NE-2026-XXXXX
            </p>
          </div>
        )}

        {/* 底部链接 */}
        <div className="mt-8 text-center space-y-2">
          <button
            onClick={() => router.push('/')}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            ← 返回首页
          </button>
          <p className="text-[10px] text-slate-700">
            © 2026 睿筑·建筑评估
          </p>
        </div>
      </div>
    </div>
  );
}
