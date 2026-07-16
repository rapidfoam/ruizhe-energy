"use client";
// ChatAssess v3 - 20260716 - Refactored

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CITIES, CLIMATE_ZONE_LABELS } from "@/lib/data/climate";
import { BUILDING_TYPES } from "@/lib/data/building-types";
import {
  WALL_TYPES, INSULATION_MATERIALS, ROOF_TYPES,
  ROOF_INSULATION_MATERIALS, WINDOW_CONFIGS,
} from "@/lib/data/materials";
import type { FormData, EvaluationResult } from "@/lib/types";
import {
  calculateWallK, calculateRoofK, calculateRating, estimateHeatLoss,
} from "@/lib/engine/calculator";
import { getStandardLimits } from "@/lib/data/standards";
import { getBuildingType } from "@/lib/data/building-types";
import { useChatFlow } from "@/components/ChatAssess/useChatFlow";
import { getSmartDefaults, YEAR_LABELS } from "@/components/ChatAssess/constants";
import type { QuickReply } from "@/components/ChatAssess/types";

export default function ChatAssessPage() {
  const router = useRouter();
  const { messages, step, data, setData, addBotMessage, addUserMessage, processStep } = useChatFlow();
  const [citySearch, setCitySearch] = useState("");
  const [cityResults, setCityResults] = useState<typeof CITIES>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize with greeting
  useEffect(() => {
    const timer = setTimeout(() => {
      addBotMessage(
        "你好！我是睿筑评估助手 \u{1F3E0}\n\n我来帮你评估你的建筑保温节能情况。整个过程大约2分钟，只需要回答几个简单的问题就行。\n\n请问你想评估哪方面？",
        {
          quickReplies: [
            { text: "保温节能", value: "energy" },
            { text: "隔音效果（即将上线）", value: "acoustic", disabled: true },
          ],
        }
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [addBotMessage]);

  // City search
  useEffect(() => {
    if (citySearch.length > 0) {
      const results = CITIES.filter(
        (c) => c.name.includes(citySearch) || c.province.includes(citySearch)
      ).slice(0, 8);
      setCityResults(results);
      setShowCityDropdown(true);
    } else {
      setCityResults([]);
      setShowCityDropdown(false);
    }
  }, [citySearch]);

  const handleQuickReply = (reply: QuickReply) => {
    if (reply.disabled) return;
    addUserMessage(reply.text);
    processStep(step, reply.value, reply.text);
    if (step === "window") {
      setTimeout(() => showSummary(), 500);
    }
  };

  const handleCitySelect = (city: typeof CITIES[0]) => {
    addUserMessage(city.name);
    setShowCityDropdown(false);
    setCitySearch("");
    setData((prev) => ({ ...prev, city: city.name, climateZone: city.zone }));
    processStep("city", city.name, city.name);
    setTimeout(() => {
      addBotMessage(
        `${city.name}，了解了！\n\n你的房子是哪种类型？`,
        {
          quickReplies: [
            { text: "独栋住宅", value: "residential" },
            { text: "联排/双拼", value: "residential" },
            { text: "公寓/单元房", value: "residential" },
            { text: "办公楼", value: "office" },
            { text: "厂房", value: "factory" },
            { text: "其他", value: "other" },
          ],
        }
      );
    }, 500);
  };

  const showSummary = () => {
    const cityName = data.city || "未知";
    const zone = data.climateZone ? CLIMATE_ZONE_LABELS[data.climateZone] : "未知";
    const bType = data.buildingType ? BUILDING_TYPES.find((b) => b.id === data.buildingType)?.name : "未知";
    const wallType = data.wallType ? WALL_TYPES.find((w) => w.id === data.wallType)?.name : "根据当地常见做法估算";
    const roofType = data.roofType ? ROOF_TYPES.find((r) => r.id === data.roofType)?.name : "根据当地常见做法估算";
    const windowCfg = data.windowConfig ? WINDOW_CONFIGS.find((w) => w.id === data.windowConfig)?.name : "断桥铝中空窗";

    addBotMessage(
      `太好了！我已收集好所有信息：\n\n\u{1F4CD} 城市：${cityName}（${zone}）\n\u{1F3E0} 类型：${bType}\n\u{1F4C5} 年代：${YEAR_LABELS[data.year || ""] || "不确定"}\n\u{1F9F1} 外墙：${wallType}\n\u{1F3E0} 屋面：${roofType}\n\u{1FA9F} 外窗：${windowCfg}\n\n点击下方按钮，立即生成评估报告！`,
      { showSubmit: true }
    );
  };

  const handleSubmit = () => {
    const zone = data.climateZone || "cold";
    const bType = data.buildingType || "residential";
    const limits = getStandardLimits(zone, bType);
    const bInfo = getBuildingType(bType);
    const defaults = getSmartDefaults(zone, bType, data.year || "unknown");

    const wallTypeId = data.wallType || defaults.wallType;
    const wallThickness = defaults.wallThickness;
    const wallInsId = data.wallInsulation || defaults.wallInsulation;
    const wallInsThick = data.wallInsulationThickness || defaults.wallInsulationThickness;
    const roofTypeId = data.roofType || defaults.roofType;
    const roofThickness = defaults.roofThickness;
    const roofInsId = data.roofInsulation || defaults.roofInsulation;
    const roofInsThick = data.roofInsulationThickness || defaults.roofInsulationThickness;
    const windowCfgId = data.windowConfig || defaults.windowConfig;

    const wallType = WALL_TYPES.find((t) => t.id === wallTypeId)!;
    const wallIns = INSULATION_MATERIALS.find((m) => m.id === wallInsId)!;
    const wallResult = calculateWallK({ wallType, wallThickness, insulationLayer: wallIns, insulationThickness: wallInsThick });

    const roofType = ROOF_TYPES.find((t) => t.id === roofTypeId)!;
    const roofIns = ROOF_INSULATION_MATERIALS.find((m) => m.id === roofInsId)!;
    const roofResult = calculateRoofK({ roofType, roofThickness, insulationLayer: roofIns, insulationThickness: roofInsThick });

    const windowCfg = WINDOW_CONFIGS.find((w) => w.id === windowCfgId)!;
    const ratingResult = calculateRating(wallResult.kValue, roofResult.kValue, windowCfg.kValue, limits.wallK, limits.roofK, limits.windowK);
    const heatLoss = estimateHeatLoss(wallResult.kValue, roofResult.kValue, windowCfg.kValue, bInfo.wallAreaRatio, bInfo.roofAreaRatio, bInfo.windowRatio);

    const result: EvaluationResult = {
      wallK: wallResult.kValue, roofK: roofResult.kValue, windowK: windowCfg.kValue,
      wallLimit: limits.wallK, roofLimit: limits.roofK, windowLimit: limits.windowK,
      wallPass: ratingResult.wallStatus === "pass", roofPass: ratingResult.roofStatus === "pass", windowPass: ratingResult.windowStatus === "pass",
      wallExcess: ratingResult.wallExcess, roofExcess: ratingResult.roofExcess, windowExcess: ratingResult.windowExcess,
      rating: ratingResult.rating, score: ratingResult.score, heatLoss,
      wallLayers: wallResult.layers.map((l) => ({ name: l.materialName, thickness: l.thickness, resistance: l.resistance, lambdaC: l.lambdaC })),
      roofLayers: roofResult.layers.map((l) => ({ name: l.materialName, thickness: l.thickness, resistance: l.resistance, lambdaC: l.lambdaC })),
      wallTotalResistance: wallResult.totalResistance, roofTotalResistance: roofResult.totalResistance,
      timestamp: new Date().toISOString(),
    };

    const formData: FormData = {
      city: data.city || "", climateZone: zone, buildingType: bType,
      wallType: wallTypeId, wallThickness, wallInsulation: wallInsId, wallInsulationThickness: wallInsThick,
      roofType: roofTypeId, roofThickness, roofInsulation: roofInsId, roofInsulationThickness: roofInsThick,
      windowConfig: windowCfgId,
    };

    sessionStorage.setItem("evaluationForm", JSON.stringify(formData));
    sessionStorage.setItem("evaluationResult", JSON.stringify(result));
    router.push("/report");
  };

  const handleInputSubmit = () => {
    if (cityResults.length > 0) handleCitySelect(cityResults[0]);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      <header className="flex items-center gap-3 px-4 py-3 bg-[#1A3A5C] text-white shadow-md shrink-0">
        <button onClick={() => router.push("/")} className="p-1 rounded hover:bg-white/10 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <div>
          <h1 className="text-lg font-bold">睿筑评估助手</h1>
          <p className="text-xs text-blue-200">对话式建筑节能评估</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"} animate-slide-up`}>
            {msg.type === "bot" && (
              <div className="w-8 h-8 rounded-full bg-[#1A3A5C] flex items-center justify-center text-white text-sm mr-2 shrink-0">{"\u{1F3E0}"}</div>
            )}
            <div className={`max-w-[80%] ${msg.type === "user" ? "order-first" : ""}`}>
              <div className={`px-4 py-3 rounded-2xl whitespace-pre-line text-sm leading-relaxed ${msg.type === "user" ? "bg-blue-600 text-white rounded-br-md" : "bg-white text-slate-800 shadow-sm rounded-bl-md"}`}>
                {msg.text}
              </div>
              {msg.quickReplies && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {msg.quickReplies.map((reply, idx) => (
                    <button key={idx} disabled={reply.disabled} onClick={() => handleQuickReply(reply)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${reply.disabled ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 active:scale-95"}`}
                      style={{ animationDelay: `${idx * 80}ms` }}>
                      {reply.text}
                    </button>
                  ))}
                </div>
              )}
              {msg.showSubmit && (
                <div className="mt-3">
                  <button onClick={handleSubmit} className="w-full py-3 rounded-xl bg-[#1A3A5C] text-white font-bold text-sm hover:bg-[#244a70] transition-colors shadow-md">
                    生成评估报告
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {step === "city" && messages[messages.length - 1]?.showInput && (
          <div className="relative">
            <div className="flex gap-2">
              <input ref={inputRef} type="text" value={citySearch} onChange={(e) => setCitySearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInputSubmit()} placeholder="输入城市名搜索..."
                className="flex-1 px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:outline-none shadow-sm" autoFocus />
              <button onClick={handleInputSubmit} className="px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">确定</button>
            </div>
            {showCityDropdown && cityResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-10">
                {cityResults.map((city, idx) => (
                  <button key={idx} onClick={() => handleCitySelect(city)}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50 transition-colors flex justify-between items-center border-b border-slate-100 last:border-0">
                    <span className="font-medium text-slate-800">{city.name}</span>
                    <span className="text-xs text-slate-500">{city.province} · {CLIMATE_ZONE_LABELS[city.zone]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <style jsx>{`
        @keyframes slide-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );
}
