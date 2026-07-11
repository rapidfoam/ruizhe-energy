"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import html2canvas from "html2canvas";
import { CLIMATE_ZONE_LABELS, type ClimateZone } from "@/lib/data/climate";
import { BUILDING_TYPES } from "@/lib/data/building-types";
import { WINDOW_CONFIGS } from "@/lib/data/materials";
import type { FormData, EvaluationResult } from "@/lib/types";

export default function ReportPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [showAuth, setShowAuth] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    try {
      const formStr = sessionStorage.getItem("evaluationForm");
      const resultStr = sessionStorage.getItem("evaluationResult");
      
      // Debug info for troubleshooting
      const debug = {
        formExists: !!formStr,
        resultExists: !!resultStr,
        formKeys: formStr ? Object.keys(JSON.parse(formStr)) : [],
        resultKeys: resultStr ? Object.keys(JSON.parse(resultStr)) : [],
        formPreview: formStr ? formStr.substring(0, 200) : "null",
        storageAvailable: typeof window !== "undefined" && "sessionStorage" in window,
      };
      setDebugInfo(JSON.stringify(debug, null, 2));
      
      if (formStr) setFormData(JSON.parse(formStr));
      if (resultStr) setResult(JSON.parse(resultStr));
      
      // Check if already authenticated
      const authed = sessionStorage.getItem("userAuthenticated");
      if (authed === "true") {
        setAuthenticated(true);
        setShowAuth(false);
      }
    } catch (err) {
      setDebugInfo(`Error reading sessionStorage: ${err}`);
    }
  }, []);

  const handleExport = useCallback(async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: "#0f172a",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `建筑节能评估报告_${formData?.city || ""}_${new Date().toLocaleDateString("zh-CN")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }, [formData]);

  if (!formData || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-slate-300 font-medium mb-2">暂无评估数据</p>
          <p className="text-slate-500 text-sm mb-4">请先完成建筑信息填写</p>
          <button 
            onClick={() => router.push("/form")} 
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            返回填写
          </button>
          
          {/* Debug Info */}
          <details className="mt-6 text-left">
            <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400 mb-2">
              调试信息（点击展开）
            </summary>
            <pre className="text-[10px] text-slate-500 bg-slate-800/50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
              {debugInfo || "No debug info available"}
            </pre>
          </details>
        </div>
      </div>
    );
  }

  const bType = BUILDING_TYPES.find((b) => b.id === formData.buildingType);
  const windowCfg = WINDOW_CONFIGS.find((w) => w.id === formData.windowConfig);
  const zoneLabel = formData.climateZone ? CLIMATE_ZONE_LABELS[formData.climateZone as ClimateZone] : "";

  const ratingColors: Record<string, string> = {
    A: "text-emerald-400", B: "text-blue-400", C: "text-amber-400", D: "text-orange-400", E: "text-red-400",
  };
  const ratingBg: Record<string, string> = {
    A: "bg-emerald-500/10 border-emerald-500/30", B: "bg-blue-500/10 border-blue-500/30",
    C: "bg-amber-500/10 border-amber-500/30", D: "bg-orange-500/10 border-orange-500/30",
    E: "bg-red-500/10 border-red-500/30",
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Auth Modal */}
      {showAuth && !authenticated && (
        <AuthModal onSuccess={() => { setAuthenticated(true); setShowAuth(false); sessionStorage.setItem("userAuthenticated", "true"); }} />
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0f172a]/95 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => router.push("/form")} className="text-slate-400 hover:text-slate-200 text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              重新评估
            </button>
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="睿筑" className="h-9 w-auto" />
              <h1 className="text-sm font-medium text-slate-300">睿筑建筑节能评估</h1>
            </div>
            <div className="w-16" />
          </div>
          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!authenticated) {
                  setShowAuth(true);
                  return;
                }
                handleExport();
              }}
              disabled={exporting}
              className="flex-1 py-2 px-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              {exporting ? "导出中..." : "保存报告"}
            </button>
            <button
              onClick={() => {
                if (!authenticated) {
                  setShowAuth(true);
                  return;
                }
                handleExport();
              }}
              disabled={exporting}
              className="flex-1 py-2 px-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-slate-300 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              下载长图
            </button>
          </div>
          {!authenticated && (
            <p className="text-[10px] text-slate-500 text-center mt-1.5">注册后可保存和下载报告</p>
          )}
        </div>
      </header>

      {/* Report Content */}
      <div ref={reportRef} className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Report Title */}
        <div className="text-center py-4 border-b border-slate-700/50">
          <h2 className="text-lg font-bold text-slate-100">睿筑建筑节能评估报告</h2>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            {new Date(result.timestamp).toLocaleString("zh-CN")}
          </p>
        </div>

        {/* Basic Info */}
        <section className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-500 rounded-full" />基本信息
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <InfoItem label="评估城市" value={formData.city} />
            <InfoItem label="气候分区" value={zoneLabel} />
            <InfoItem label="建筑类型" value={bType?.name || ""} />
            <InfoItem label="外窗配置" value={windowCfg?.name || ""} />
          </div>
        </section>

        {/* Overall Rating */}
        <section className={`p-5 rounded-xl border ${ratingBg[result.rating]}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-300">综合评级</h3>
            <div className={`text-4xl font-bold font-mono ${ratingColors[result.rating]}`}>
              {result.rating}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  result.score >= 90 ? "bg-emerald-500" : result.score >= 75 ? "bg-blue-500" : result.score >= 60 ? "bg-amber-500" : result.score >= 40 ? "bg-orange-500" : "bg-red-500"
                }`}
                style={{ width: `${result.score}%` }}
              />
            </div>
            <span className="text-lg font-mono font-bold text-slate-200">{result.score}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {result.rating === "A" ? "优秀 - 全面达标，节能性能优异" :
             result.rating === "B" ? "良好 - 基本达标，有小幅优化空间" :
             result.rating === "C" ? "一般 - 部分指标接近限值" :
             result.rating === "D" ? "较差 - 多项指标超标" : "不合格 - 严重超标，需重点改进"}
          </p>
        </section>

        {/* K Value Comparison */}
        <section className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-500 rounded-full" />K值对比分析
          </h3>
          <div className="space-y-3">
            <KCompareRow label="外墙" kValue={result.wallK} limit={result.wallLimit} pass={result.wallPass} excess={result.wallExcess} />
            <KCompareRow label="屋面" kValue={result.roofK} limit={result.roofLimit} pass={result.roofPass} excess={result.roofExcess} />
            <KCompareRow label="外窗" kValue={result.windowK} limit={result.windowLimit} pass={result.windowPass} excess={result.windowExcess} />
          </div>
          {/* Summary table */}
          <div className="mt-4 border border-slate-700/50 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-700/30">
                  <th className="py-2 px-3 text-left text-slate-400 font-medium">构件</th>
                  <th className="py-2 px-3 text-right text-slate-400 font-medium">计算K值</th>
                  <th className="py-2 px-3 text-right text-slate-400 font-medium">标准限值</th>
                  <th className="py-2 px-3 text-right text-slate-400 font-medium">判定</th>
                  <th className="py-2 px-3 text-right text-slate-400 font-medium">偏差</th>
                </tr>
              </thead>
              <tbody>
                <SummaryRow name="外墙" k={result.wallK} limit={result.wallLimit} pass={result.wallPass} excess={result.wallExcess} />
                <SummaryRow name="屋面" k={result.roofK} limit={result.roofLimit} pass={result.roofPass} excess={result.roofExcess} />
                <SummaryRow name="外窗" k={result.windowK} limit={result.windowLimit} pass={result.windowPass} excess={result.windowExcess} />
              </tbody>
            </table>
          </div>
        </section>

        {/* Calculation Basis - Collapsible */}
        <CalculationBasis />

        {/* Construction Layers */}
        <section className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-500 rounded-full" />构造层次分析
          </h3>
          <LayerDiagram title="外墙构造" layers={result.wallLayers} totalR={result.wallTotalResistance} />
          <div className="mt-4" />
          <LayerDiagram title="屋面构造" layers={result.roofLayers} totalR={result.roofTotalResistance} />
        </section>

        {/* Heat Loss Distribution */}
        <section className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-500 rounded-full" />热损失分布估算
          </h3>
          <HeatLossChart data={result.heatLoss} />
        </section>

        {/* Cause Analysis */}
        <section className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-500 rounded-full" />原因分析
          </h3>
          <div className="space-y-2">
            {!result.wallPass && (
              <AnalysisItem
                title="外墙传热系数超标"
                detail={`计算值 ${result.wallK} W/(m²·K) 超过限值 ${result.wallLimit} W/(m²·K)，超标幅度 ${result.wallExcess}%。保温层热阻不足或基层墙体导热系数偏高。`}
              />
            )}
            {!result.roofPass && (
              <AnalysisItem
                title="屋面传热系数超标"
                detail={`计算值 ${result.roofK} W/(m²·K) 超过限值 ${result.roofLimit} W/(m²·K)，超标幅度 ${result.roofExcess}%。屋面保温层厚度不足或材料导热性能不满足要求。`}
              />
            )}
            {!result.windowPass && (
              <AnalysisItem
                title="外窗传热系数超标"
                detail={`计算值 ${result.windowK} W/(m²·K) 超过限值 ${result.windowLimit} W/(m²·K)，超标幅度 ${result.windowExcess}%。窗户层数不足或未采用Low-E玻璃、断桥型材。`}
              />
            )}
            {result.wallPass && result.roofPass && result.windowPass && (
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <p className="text-xs text-emerald-400">所有构件均达标，建筑围护结构节能性能良好。</p>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-4 border-t border-slate-700/50">
          <p className="text-[10px] text-slate-600">评估依据: GB 55015-2021 / GB 50176-2016</p>
          <p className="text-[10px] text-slate-600 mt-0.5">本报告仅供参考，不作为正式设计依据</p>
        </div>
      </div>
    </div>
  );
}

/* ========== Sub Components ========== */

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className="text-sm text-slate-200 font-medium">{value}</p>
    </div>
  );
}

function KCompareRow({ label, kValue, limit, pass, excess }: {
  label: string; kValue: number; limit: number; pass: boolean; excess: number;
}) {
  const ratio = Math.min(kValue / limit, 2);
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-slate-400">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-300">{kValue}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${pass ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
            {pass ? "达标" : `超标${excess}%`}
          </span>
        </div>
      </div>
      <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className="absolute left-0 top-0 h-full bg-slate-500/30 rounded-full" style={{ width: "100%" }} />
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${pass ? "bg-emerald-500" : "bg-red-500"}`}
          style={{ width: `${Math.min(ratio * 50, 100)}%` }}
        />
        {/* Limit marker */}
        <div className="absolute top-0 h-full w-0.5 bg-amber-400" style={{ left: "50%" }} />
      </div>
      <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
        <span>0</span>
        <span className="text-amber-500">限值 {limit}</span>
      </div>
    </div>
  );
}

function SummaryRow({ name, k, limit, pass, excess }: {
  name: string; k: number; limit: number; pass: boolean; excess: number;
}) {
  return (
    <tr className="border-t border-slate-700/30">
      <td className="py-2 px-3 text-slate-300">{name}</td>
      <td className="py-2 px-3 text-right font-mono text-slate-200">{k}</td>
      <td className="py-2 px-3 text-right font-mono text-slate-400">≤{limit}</td>
      <td className={`py-2 px-3 text-right ${pass ? "text-emerald-400" : "text-red-400"}`}>
        {pass ? "达标" : "超标"}
      </td>
      <td className={`py-2 px-3 text-right font-mono ${pass ? "text-emerald-400" : "text-red-400"}`}>
        {pass ? `-${Math.abs(excess).toFixed(1)}%` : `+${excess.toFixed(1)}%`}
      </td>
    </tr>
  );
}

function LayerDiagram({ title, layers, totalR }: {
  title: string;
  layers: { name: string; thickness: number; resistance: number; lambdaC: number }[];
  totalR: number;
}) {
  const colors = ["bg-amber-500/20 border-amber-500/30", "bg-blue-500/20 border-blue-500/30", "bg-emerald-500/20 border-emerald-500/30", "bg-purple-500/20 border-purple-500/30"];

  return (
    <div>
      <p className="text-xs text-slate-400 mb-2">{title}</p>
      {/* Visual layer diagram */}
      <div className="flex gap-1 mb-3">
        {layers.map((layer, i) => {
          const widthPct = Math.max(20, layer.thickness / 3);
          return (
            <div key={i} className={`flex-1 min-w-[40px] p-2 rounded border ${colors[i % colors.length]}`} style={{ flex: widthPct }}>
              <p className="text-[10px] text-slate-300 truncate">{layer.name}</p>
              <p className="text-[10px] text-slate-500 font-mono">{layer.thickness}mm</p>
            </div>
          );
        })}
      </div>
      {/* Detail table */}
      <div className="border border-slate-700/50 rounded-lg overflow-hidden">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="bg-slate-700/30">
              <th className="py-1.5 px-2 text-left text-slate-500">层次</th>
              <th className="py-1.5 px-2 text-right text-slate-500">厚度(mm)</th>
              <th className="py-1.5 px-2 text-right text-slate-500">λc</th>
              <th className="py-1.5 px-2 text-right text-slate-500">R值</th>
            </tr>
          </thead>
          <tbody>
            {layers.map((l, i) => (
              <tr key={i} className="border-t border-slate-700/20">
                <td className="py-1.5 px-2 text-slate-300">{l.name}</td>
                <td className="py-1.5 px-2 text-right font-mono text-slate-400">{l.thickness}</td>
                <td className="py-1.5 px-2 text-right font-mono text-slate-400">{l.lambdaC}</td>
                <td className="py-1.5 px-2 text-right font-mono text-slate-300">{l.resistance}</td>
              </tr>
            ))}
            <tr className="border-t border-slate-700/30 bg-slate-700/20">
              <td className="py-1.5 px-2 text-slate-400 font-medium">总热阻 R0</td>
              <td className="py-1.5 px-2" colSpan={2} />
              <td className="py-1.5 px-2 text-right font-mono text-blue-400 font-medium">{totalR}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HeatLossChart({ data }: { data: { wall: number; roof: number; window: number; infiltration: number } }) {
  const items = [
    { label: "外墙", value: data.wall, color: "bg-amber-500" },
    { label: "屋面", value: data.roof, color: "bg-blue-500" },
    { label: "外窗", value: data.window, color: "bg-purple-500" },
    { label: "渗透通风", value: data.infiltration, color: "bg-slate-500" },
  ];

  return (
    <div>
      {/* Horizontal stacked bar */}
      <div className="flex h-4 rounded-full overflow-hidden mb-3">
        {items.map((item) => (
          item.value > 0 && <div key={item.label} className={`${item.color} transition-all duration-500`} style={{ width: `${item.value}%` }} />
        ))}
      </div>
      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-sm ${item.color}`} />
            <span className="text-xs text-slate-400">{item.label}</span>
            <span className="text-xs font-mono text-slate-300 ml-auto">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalysisItem({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
      <p className="text-xs font-medium text-red-400 mb-1">{title}</p>
      <p className="text-[11px] text-slate-400 leading-relaxed">{detail}</p>
    </div>
  );
}

/* ========== Calculation Basis Component ========== */

function CalculationBasis() {
  const [expanded, setExpanded] = useState(true);

  return (
    <section className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
          <span className="w-1 h-4 bg-blue-500 rounded-full" />
          计算依据与方法
        </h3>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 text-xs text-slate-400 leading-relaxed">
          {/* Standards */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 mb-2">计算依据</h4>
            <ol className="list-decimal list-inside space-y-1 pl-1">
              <li>民用建筑热工设计规范 <span className="text-blue-400">GB 50176-2016</span></li>
              <li>公共建筑节能设计标准 <span className="text-blue-400">GB 50189-2015</span></li>
              <li>严寒和寒冷地区居住建筑节能设计标准 <span className="text-blue-400">JGJ 26-2010</span></li>
              <li>夏热冬冷地区居住建筑节能设计标准 <span className="text-blue-400">JGJ 134-2010</span></li>
              <li>夏热冬暖地区居住建筑节能设计标准 <span className="text-blue-400">JGJ 75-2012</span></li>
            </ol>
          </div>

          {/* Method */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 mb-2">计算方法</h4>
            <p className="mb-2">
              本评估采用<span className="text-slate-200">规定性指标法</span>，通过计算建筑围护结构各部位的传热系数K值，与相应气候分区和建筑类型的标准限值进行对比，判定节能达标情况。
            </p>
            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/30 font-mono text-[11px]">
              <p className="text-slate-200 mb-1">传热系数计算公式：</p>
              <p className="text-blue-400">K = 1 / R₀</p>
              <p className="text-slate-300 mt-1">其中：R₀ = R<sub>i</sub> + Σ(d<sub>i</sub>/λ<sub>i</sub>) + R<sub>e</sub></p>
            </div>
            <div className="mt-2 space-y-1 pl-2">
              <p>• R₀：围护结构总热阻 (m²·K/W)</p>
              <p>• R<sub>i</sub>：内表面换热阻（GB 50176-2016 表3.1.2-1）</p>
              <p className="pl-4 text-slate-400">- 墙面：<span className="text-slate-200">0.11</span> m²·K/W（热流向下或水平）</p>
              <p className="pl-4 text-slate-400">- 屋面：<span className="text-slate-200">0.13</span> m²·K/W（热流向上）</p>
              <p>• R<sub>e</sub>：外表面换热阻，取 <span className="text-slate-200">0.04</span> m²·K/W（GB 50176-2016 表3.1.2-2）</p>
              <p>• d<sub>i</sub>：各层材料厚度 (m)</p>
              <p>• λ<sub>i</sub>：各层材料导热系数 [W/(m·K)]</p>
            </div>
          </div>

          {/* Construction layers */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 mb-2">计算层次</h4>
            <div className="space-y-2">
              <div className="p-2 bg-slate-900/30 rounded border border-slate-700/20">
                <p className="text-slate-300 font-medium mb-1">外墙（由外到内）：</p>
                <p className="text-[11px] text-slate-400">
                  外抹灰层（水泥砂浆 20mm, λ=0.93）→ 外墙基层 → 保温层 → 内抹灰层（水泥砂浆 20mm, λ=0.93）
                </p>
              </div>
              <div className="p-2 bg-slate-900/30 rounded border border-slate-700/20">
                <p className="text-slate-300 font-medium mb-1">屋面（由外到内）：</p>
                <p className="text-[11px] text-slate-400">
                  外抹灰层（水泥砂浆 20mm, λ=0.93）→ 保温层 → 屋面板基层 → 内抹灰层（水泥砂浆 20mm, λ=0.93）
                </p>
              </div>
              <div className="p-2 bg-slate-900/30 rounded border border-slate-700/20">
                <p className="text-slate-300 font-medium mb-1">外窗：</p>
                <p className="text-[11px] text-slate-400">
                  直接采用国标 GB 50176-2016 附录E 查表值
                </p>
              </div>
            </div>
          </div>

          {/* Rating explanation */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 mb-2">评级说明</h4>
            <div className="grid grid-cols-5 gap-1">
              {[
                { grade: "A", range: "90-100", desc: "优秀", color: "text-emerald-400 bg-emerald-500/10" },
                { grade: "B", range: "75-89", desc: "良好", color: "text-blue-400 bg-blue-500/10" },
                { grade: "C", range: "60-74", desc: "一般", color: "text-amber-400 bg-amber-500/10" },
                { grade: "D", range: "40-59", desc: "较差", color: "text-orange-400 bg-orange-500/10" },
                { grade: "E", range: "0-39", desc: "不合格", color: "text-red-400 bg-red-500/10" },
              ].map((item) => (
                <div key={item.grade} className={`p-1.5 rounded text-center ${item.color}`}>
                  <p className="text-sm font-bold">{item.grade}</p>
                  <p className="text-[9px]">{item.range}分</p>
                  <p className="text-[9px]">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              评分逻辑：对每个围护结构部位，K值与标准限值的比值越小得分越高；综合评级取三个部位得分的加权平均值。
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

/* ========== Auth Modal ========== */

function AuthModal({ onSuccess }: { onSuccess: () => void }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");

  const handleSendCode = () => {
    if (!/^1\d{10}$/.test(phone)) {
      setError("请输入正确的手机号");
      return;
    }
    setError("");
    setSent(true);
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleVerify = () => {
    if (code.length !== 6) {
      setError("请输入6位验证码");
      return;
    }
    // Simulate verification (in production, this would call an API)
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-100">查看评估报告</h3>
          <p className="text-xs text-slate-400 mt-1">请使用手机号注册后查看完整报告</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">手机号</label>
            <input
              type="tel"
              maxLength={11}
              placeholder="请输入手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">验证码</label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                placeholder="6位验证码"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="flex-1 px-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
              />
              <button
                onClick={handleSendCode}
                disabled={countdown > 0 || phone.length !== 11}
                className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:hover:bg-slate-700 text-xs text-slate-300 rounded-lg whitespace-nowrap transition-colors"
              >
                {countdown > 0 ? `${countdown}s` : sent ? "重新发送" : "获取验证码"}
              </button>
            </div>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            onClick={handleVerify}
            disabled={!sent || code.length !== 6}
            className="w-full py-3 bg-blue-500 hover:bg-blue-400 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-all"
          >
            验证并查看报告
          </button>
        </div>
        <p className="text-[10px] text-slate-600 text-center mt-4">
          注册即表示同意《用户服务协议》和《隐私政策》
        </p>
        
        {/* 跳过注册按钮 - 移动端优化 */}
        <div className="mt-6 pt-4 border-t border-slate-600/50">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-px bg-slate-700/50"></div>
            <span className="text-xs text-slate-500">测试模式</span>
            <div className="flex-1 h-px bg-slate-700/50"></div>
          </div>
          <button
            onClick={onSuccess}
            className="w-full py-3.5 text-base font-medium text-white bg-slate-600 hover:bg-slate-500 border border-slate-500/50 rounded-xl transition-all active:scale-[0.98] shadow-lg"
          >
            跳过注册，预览报告
          </button>
          <p className="text-[10px] text-slate-500 text-center mt-2">
            预览模式可查看报告，注册后可保存和下载
          </p>
        </div>
      </div>
    </div>
  );
}
