"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CITIES, CLIMATE_ZONE_LABELS, CITY_ZONE_MAP, type ClimateZone } from "@/lib/data/climate";
import { BUILDING_TYPES, type BuildingType } from "@/lib/data/building-types";
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

// ============ Types ============

interface QuickReply {
  text: string;
  value: string;
  disabled?: boolean;
}

interface ChatMessage {
  id: string;
  type: "bot" | "user";
  text: string;
  quickReplies?: QuickReply[];
  showInput?: boolean;
  showSubmit?: boolean;
}

type ChatStep =
  | "select_type"
  | "city"
  | "building_type"
  | "year"
  | "wall"
  | "wall_detail"
  | "wall_insulation"
  | "roof"
  | "roof_detail"
  | "roof_insulation"
  | "window"
  | "summary";

// ============ Smart Defaults ============

interface SmartDefaults {
  wallType: string;
  wallThickness: number;
  wallInsulation: string;
  wallInsulationThickness: number;
  roofType: string;
  roofThickness: number;
  roofInsulation: string;
  roofInsulationThickness: number;
  windowConfig: string;
}

function getSmartDefaults(zone: ClimateZone, buildingType: BuildingType, year: string): SmartDefaults {
  // 根据气候分区和建筑类型推断默认值
  const isCold = zone === "severe_cold" || zone === "cold";
  const isHotCold = zone === "hot_summer_cold_winter";
  const isHotWarm = zone === "hot_summer_warm_winter";
  const isResidential = buildingType === "residential";

  // 外墙默认
  let wallType = "aerated_concrete_block";
  let wallThickness = 200;
  if (zone === "severe_cold" || zone === "cold") {
    wallType = "concrete_shear_wall";
    wallThickness = 250;
  } else if (isResidential) {
    wallType = "aerated_concrete_block";
    wallThickness = 200;
  }

  // 保温层默认
  let wallInsulation = "eps_board";
  let wallInsulationThickness = 50;
  if (isCold) {
    wallInsulation = "seps_board";
    wallInsulationThickness = year === "before2005" ? 40 : 60;
  } else if (isHotCold) {
    wallInsulation = "eps_board";
    wallInsulationThickness = year === "before2005" ? 30 : 50;
  } else if (isHotWarm) {
    wallInsulation = "eps_board";
    wallInsulationThickness = 30;
  }

  // 屋面默认
  let roofType = "concrete_roof";
  let roofThickness = 120;
  if (isResidential && (zone === "hot_summer_cold_winter" || zone === "hot_summer_warm_winter")) {
    roofType = "clay_tile_roof";
    roofThickness = 30;
  }

  // 屋面保温
  let roofInsulation = "roof_xps_50";
  let roofInsulationThickness = 50;
  if (isCold) {
    roofInsulation = "roof_xps_60";
    roofInsulationThickness = 60;
  } else if (isHotWarm) {
    roofInsulation = "roof_xps_40";
    roofInsulationThickness = 40;
  }

  // 窗户默认
  let windowConfig = "double_bridge_alu";
  if (year === "before2005") {
    windowConfig = "double_alu";
  } else if (year === "after2020" || year === "2016_2020") {
    windowConfig = "double_bridge_low_e";
  }

  return {
    wallType, wallThickness, wallInsulation, wallInsulationThickness,
    roofType, roofThickness, roofInsulation, roofInsulationThickness,
    windowConfig,
  };
}

// ============ Component ============

export default function ChatAssessPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState<ChatStep>("select_type");
  const [citySearch, setCitySearch] = useState("");
  const [cityResults, setCityResults] = useState<typeof CITIES>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  // Assessment data
  const [data, setData] = useState<Partial<FormData>>({});
  const [year, setYear] = useState("");
  const [wallChoice, setWallChoice] = useState<"know" | "estimate">("estimate");
  const [roofChoice, setRoofChoice] = useState<"know" | "estimate">("estimate");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Generate unique ID
  const genId = () => Math.random().toString(36).slice(2, 10);

  // Add bot message
  const addBotMessage = useCallback((text: string, options?: {
    quickReplies?: QuickReply[];
    showInput?: boolean;
    showSubmit?: boolean;
  }) => {
    const msg: ChatMessage = {
      id: genId(),
      type: "bot",
      text,
      ...options,
    };
    setMessages((prev) => [...prev, msg]);
  }, []);

  // Add user message
  const addUserMessage = useCallback((text: string) => {
    const msg: ChatMessage = {
      id: genId(),
      type: "user",
      text,
    };
    setMessages((prev) => [...prev, msg]);
  }, []);

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

  // Handle quick reply click
  const handleQuickReply = (reply: QuickReply) => {
    if (reply.disabled) return;
    addUserMessage(reply.text);
    processStep(step, reply.value, reply.text);
  };

  // Handle city selection
  const handleCitySelect = (city: typeof CITIES[0]) => {
    addUserMessage(city.name);
    setShowCityDropdown(false);
    setCitySearch("");
    setData((prev) => ({ ...prev, city: city.name, climateZone: city.zone }));
    setStep("building_type");

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

  // Process each step
  const processStep = (currentStep: ChatStep, value: string, displayText: string) => {
    switch (currentStep) {
      case "select_type":
        if (value === "energy") {
          setStep("city");
          setTimeout(() => {
            addBotMessage(
              "好的，我们来评估保温节能！\n\n你的房子在哪个城市？（比如：长沙、北京、上海）",
              { showInput: true }
            );
          }, 500);
        }
        break;

      case "building_type": {
        const bType = value === "other" ? "residential" : value as BuildingType;
        setData((prev) => ({ ...prev, buildingType: bType }));
        setStep("year");
        setTimeout(() => {
          addBotMessage(
            "大概是哪年建成的？\n不同年代的建筑执行不同的国家节能标准，这会影响评估结果。",
            {
              quickReplies: [
                { text: "2020年以后", value: "after2020" },
                { text: "2016-2020", value: "2016_2020" },
                { text: "2011-2015", value: "2011_2015" },
                { text: "2006-2010", value: "2006_2010" },
                { text: "2005年以前", value: "before2005" },
                { text: "不确定", value: "unknown" },
              ],
            }
          );
        }, 500);
        break;
      }

      case "year":
        setYear(value);
        setStep("wall");
        setTimeout(() => {
          const cityName = data.city || "";
          addBotMessage(
            `关于外墙，你了解外墙的保温情况吗？\n如果不确定，我会根据${cityName}的常见做法帮你估算。`,
            {
              quickReplies: [
                { text: "我知道外墙材料", value: "know_wall" },
                { text: "不确定，帮我估算", value: "estimate_wall" },
              ],
            }
          );
        }, 500);
        break;

      case "wall":
        if (value === "estimate_wall") {
          setWallChoice("estimate");
          setStep("roof");
          setTimeout(() => {
            addBotMessage(
              "没问题！我会根据当地常见做法来估算。\n\n那屋顶呢？了解屋面的保温情况吗？",
              {
                quickReplies: [
                  { text: "我知道屋面材料", value: "know_roof" },
                  { text: "不确定，帮我估算", value: "estimate_roof" },
                ],
              }
            );
          }, 500);
        } else {
          setWallChoice("know");
          setStep("wall_detail");
          setTimeout(() => {
            addBotMessage(
              "请选择你的外墙类型：",
              {
                quickReplies: WALL_TYPES.map((t) => ({ text: t.name, value: t.id })),
              }
            );
          }, 500);
        }
        break;

      case "wall_detail":
        setData((prev) => ({ ...prev, wallType: value }));
        setStep("wall_insulation");
        setTimeout(() => {
          addBotMessage(
            "外墙有做保温层吗？",
            {
              quickReplies: [
                { text: "模塑聚苯板(EPS)", value: "eps_board" },
                { text: "石墨聚苯板(SEPS)", value: "seps_board" },
                { text: "挤塑聚苯板(XPS)", value: "xps_board" },
                { text: "喷涂硬质聚氨酯", value: "pu_spray" },
                { text: "喷涂水性软泡聚氨酯", value: "water_based_pu_spray" },
                { text: "岩棉板", value: "rock_wool_board" },
                { text: "无保温层", value: "none" },
              ],
            }
          );
        }, 500);
        break;

      case "wall_insulation":
        setData((prev) => ({ ...prev, wallInsulation: value }));
        // Use default thickness based on material
        const wallMat = INSULATION_MATERIALS.find((m) => m.id === value);
        const wallThick = wallMat?.commonThicknesses?.[2] || 50;
        setData((prev) => ({ ...prev, wallInsulationThickness: wallThick }));
        setStep("roof");
        setTimeout(() => {
          addBotMessage(
            "那屋顶呢？了解屋面的保温情况吗？",
            {
              quickReplies: [
                { text: "我知道屋面材料", value: "know_roof" },
                { text: "不确定，帮我估算", value: "estimate_roof" },
              ],
            }
          );
        }, 500);
        break;

      case "roof":
        if (value === "estimate_roof") {
          setRoofChoice("estimate");
          setStep("window");
          setTimeout(() => {
            addBotMessage(
              "好的，屋面也帮你估算。\n\n最后，你的窗户是什么类型？",
              {
                quickReplies: [
                  { text: "单层玻璃窗", value: "single_alu" },
                  { text: "普通双层窗", value: "double_alu" },
                  { text: "断桥铝中空窗", value: "double_bridge_alu" },
                  { text: "Low-E中空窗", value: "double_bridge_low_e" },
                  { text: "塑钢中空窗", value: "upvc_double" },
                  { text: "不确定", value: "unknown_window" },
                ],
              }
            );
          }, 500);
        } else {
          setRoofChoice("know");
          setStep("roof_detail");
          setTimeout(() => {
            addBotMessage(
              "请选择屋面类型：",
              {
                quickReplies: ROOF_TYPES.slice(0, 6).map((t) => ({ text: t.name, value: t.id })),
              }
            );
          }, 500);
        }
        break;

      case "roof_detail":
        setData((prev) => ({ ...prev, roofType: value }));
        setStep("roof_insulation");
        setTimeout(() => {
          addBotMessage(
            "屋面保温层是什么？",
            {
              quickReplies: [
                { text: "XPS挤塑板", value: "roof_xps_50" },
                { text: "EPS聚苯板", value: "roof_eps_50" },
                { text: "聚氨酯板", value: "roof_pu_50" },
                { text: "喷涂硬质聚氨酯", value: "roof_pu_spray" },
                { text: "喷涂水性软泡聚氨酯", value: "roof_water_based_pu_spray" },
                { text: "岩棉板", value: "roof_rockwool_50" },
                { text: "无保温层", value: "roof_none" },
              ],
            }
          );
        }, 500);
        break;

      case "roof_insulation":
        setData((prev) => ({ ...prev, roofInsulation: value }));
        setStep("window");
        setTimeout(() => {
          addBotMessage(
            "最后，你的窗户是什么类型？",
            {
              quickReplies: [
                { text: "单层玻璃窗", value: "single_alu" },
                { text: "普通双层窗", value: "double_alu" },
                { text: "断桥铝中空窗", value: "double_bridge_alu" },
                { text: "Low-E中空窗", value: "double_bridge_low_e" },
                { text: "塑钢中空窗", value: "upvc_double" },
                { text: "不确定", value: "unknown_window" },
              ],
            }
          );
        }, 500);
        break;

      case "window": {
        let windowValue = value;
        if (value === "unknown_window") {
          windowValue = "double_bridge_alu";
        }
        setData((prev) => ({ ...prev, windowConfig: windowValue }));
        setStep("summary");
        setTimeout(() => {
          showSummary();
        }, 500);
        break;
      }
    }
  };

  // Show summary
  const showSummary = () => {
    const cityName = data.city || "未知";
    const zone = data.climateZone ? CLIMATE_ZONE_LABELS[data.climateZone] : "未知";
    const bType = data.buildingType ? BUILDING_TYPES.find((b) => b.id === data.buildingType)?.name : "未知";
    const wallType = data.wallType ? WALL_TYPES.find((w) => w.id === data.wallType)?.name : "根据当地常见做法估算";
    const roofType = data.roofType ? ROOF_TYPES.find((r) => r.id === data.roofType)?.name : "根据当地常见做法估算";
    const windowCfg = data.windowConfig ? WINDOW_CONFIGS.find((w) => w.id === data.windowConfig)?.name : "断桥铝中空窗";

    const yearLabels: Record<string, string> = {
      after2020: "2020年以后",
      "2016_2020": "2016-2020",
      "2011_2015": "2011-2015",
      "2006_2010": "2006-2010",
      before2005: "2005年以前",
      unknown: "不确定",
    };

    addBotMessage(
      `太好了！我已收集好所有信息：\n\n\u{1F4CD} 城市：${cityName}（${zone}）\n\u{1F3E0} 类型：${bType}\n\u{1F4C5} 年代：${yearLabels[year] || "不确定"}\n\u{1F9F1} 外墙：${wallType}\n\u{1F3E0} 屋面：${roofType}\n\u{1FA9F} 外窗：${windowCfg}\n\n点击下方按钮，立即生成评估报告！`,
      { showSubmit: true }
    );
  };

  // Handle submit - calculate and navigate to report
  const handleSubmit = () => {
    const zone = data.climateZone || "cold";
    const bType = data.buildingType || "residential";
    const limits = getStandardLimits(zone, bType);
    const bInfo = getBuildingType(bType);

    // Get smart defaults if needed
    const defaults = getSmartDefaults(zone, bType, year);

    // Fill in missing data with defaults
    const wallTypeId = data.wallType || defaults.wallType;
    const wallThickness = defaults.wallThickness;
    const wallInsId = data.wallInsulation || defaults.wallInsulation;
    const wallInsThick = data.wallInsulationThickness || defaults.wallInsulationThickness;

    const roofTypeId = data.roofType || defaults.roofType;
    const roofThickness = defaults.roofThickness;
    const roofInsId = data.roofInsulation || defaults.roofInsulation;
    const roofInsThick = data.roofInsulationThickness || defaults.roofInsulationThickness;

    const windowCfgId = data.windowConfig || defaults.windowConfig;

    // Calculate wall K
    const wallType = WALL_TYPES.find((t) => t.id === wallTypeId)!;
    const wallIns = INSULATION_MATERIALS.find((m) => m.id === wallInsId)!;
    const wallResult = calculateWallK({
      wallType,
      wallThickness,
      insulationLayer: wallIns,
      insulationThickness: wallInsThick,
    });

    // Calculate roof K
    const roofType = ROOF_TYPES.find((t) => t.id === roofTypeId)!;
    const roofIns = ROOF_INSULATION_MATERIALS.find((m) => m.id === roofInsId)!;
    const roofResult = calculateRoofK({
      roofType,
      roofThickness,
      insulationLayer: roofIns,
      insulationThickness: roofInsThick,
    });

    // Get window K
    const windowCfg = WINDOW_CONFIGS.find((w) => w.id === windowCfgId)!;

    // Calculate rating
    const ratingResult = calculateRating(
      wallResult.kValue, roofResult.kValue, windowCfg.kValue,
      limits.wallK, limits.roofK, limits.windowK
    );

    // Estimate heat loss
    const heatLoss = estimateHeatLoss(
      wallResult.kValue, roofResult.kValue, windowCfg.kValue,
      bInfo.wallAreaRatio, bInfo.roofAreaRatio, bInfo.windowRatio
    );

    // Build result
    const result: EvaluationResult = {
      wallK: wallResult.kValue,
      roofK: roofResult.kValue,
      windowK: windowCfg.kValue,
      wallLimit: limits.wallK,
      roofLimit: limits.roofK,
      windowLimit: limits.windowK,
      wallPass: ratingResult.wallStatus === "pass",
      roofPass: ratingResult.roofStatus === "pass",
      windowPass: ratingResult.windowStatus === "pass",
      wallExcess: ratingResult.wallExcess,
      roofExcess: ratingResult.roofExcess,
      windowExcess: ratingResult.windowExcess,
      rating: ratingResult.rating,
      score: ratingResult.score,
      heatLoss,
      wallLayers: wallResult.layers.map((l) => ({
        name: l.materialName, thickness: l.thickness,
        resistance: l.resistance, lambdaC: l.lambdaC,
      })),
      roofLayers: roofResult.layers.map((l) => ({
        name: l.materialName, thickness: l.thickness,
        resistance: l.resistance, lambdaC: l.lambdaC,
      })),
      wallTotalResistance: wallResult.totalResistance,
      roofTotalResistance: roofResult.totalResistance,
      timestamp: new Date().toISOString(),
    };

    // Build form data for sessionStorage
    const formData: FormData = {
      city: data.city || "",
      climateZone: zone,
      buildingType: bType,
      wallType: wallTypeId,
      wallThickness,
      wallInsulation: wallInsId,
      wallInsulationThickness: wallInsThick,
      roofType: roofTypeId,
      roofThickness,
      roofInsulation: roofInsId,
      roofInsulationThickness: roofInsThick,
      windowConfig: windowCfgId,
    };

    sessionStorage.setItem("evaluationForm", JSON.stringify(formData));
    sessionStorage.setItem("evaluationResult", JSON.stringify(result));
    router.push("/report");
  };

  // Handle input submit (for city)
  const handleInputSubmit = () => {
    if (cityResults.length > 0) {
      handleCitySelect(cityResults[0]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-[#1A3A5C] text-white shadow-md shrink-0">
        <button
          onClick={() => router.push("/")}
          className="p-1 rounded hover:bg-white/10 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-bold">睿筑评估助手</h1>
          <p className="text-xs text-blue-200">对话式建筑节能评估</p>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"} animate-slide-up`}
          >
            {msg.type === "bot" && (
              <div className="w-8 h-8 rounded-full bg-[#1A3A5C] flex items-center justify-center text-white text-sm mr-2 shrink-0">
                {"\u{1F3E0}"}
              </div>
            )}
            <div className={`max-w-[80%] ${msg.type === "user" ? "order-first" : ""}`}>
              <div
                className={`px-4 py-3 rounded-2xl whitespace-pre-line text-sm leading-relaxed ${
                  msg.type === "user"
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-white text-slate-800 shadow-sm rounded-bl-md"
                }`}
              >
                {msg.text}
              </div>
              {/* Quick Replies */}
              {msg.quickReplies && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {msg.quickReplies.map((reply, idx) => (
                    <button
                      key={idx}
                      disabled={reply.disabled}
                      onClick={() => handleQuickReply(reply)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        reply.disabled
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 active:scale-95"
                      }`}
                      style={{ animationDelay: `${idx * 80}ms` }}
                    >
                      {reply.text}
                    </button>
                  ))}
                </div>
              )}
              {/* Submit Button */}
              {msg.showSubmit && (
                <div className="mt-3">
                  <button
                    onClick={handleSubmit}
                    className="w-full py-3 rounded-xl bg-[#1A3A5C] text-white font-bold text-sm hover:bg-[#244a70] transition-colors shadow-md"
                  >
                    生成评估报告
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* City Search Input */}
        {step === "city" && messages[messages.length - 1]?.showInput && (
          <div className="relative">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInputSubmit()}
                placeholder="输入城市名搜索..."
                className="flex-1 px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:outline-none shadow-sm"
                autoFocus
              />
              <button
                onClick={handleInputSubmit}
                className="px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                确定
              </button>
            </div>
            {/* City Dropdown */}
            {showCityDropdown && cityResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-10">
                {cityResults.map((city, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCitySelect(city)}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50 transition-colors flex justify-between items-center border-b border-slate-100 last:border-0"
                  >
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

      {/* Styles */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
