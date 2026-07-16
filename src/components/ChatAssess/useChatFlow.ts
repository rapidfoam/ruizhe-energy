// ChatAssess Hook - v2
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CITIES, CLIMATE_ZONE_LABELS } from "@/lib/data/climate";
import { BUILDING_TYPES, getBuildingType, type BuildingType } from "@/lib/data/building-types";
import { WALL_TYPES, INSULATION_MATERIALS, ROOF_TYPES, ROOF_INSULATION_MATERIALS, WINDOW_CONFIGS } from "@/lib/data/materials";
import { getStandardLimits } from "@/lib/data/standards";
import { calculateWallK, calculateRoofK, calculateRating, estimateHeatLoss } from "@/lib/engine/calculator";
import type { EvaluationResult, FormData } from "@/lib/types";
import type { ChatMessage, ChatStep, ChatData, QuickReply } from "./types";
import {
  YEAR_OPTIONS, YEAR_LABELS, BUILDING_TYPE_OPTIONS, RESIDENTIAL_SUBTYPE_OPTIONS,
  WALL_TYPE_OPTIONS, WALL_THICKNESS_OPTIONS, WALL_INSULATION_CHOICE_OPTIONS,
  WALL_INSULATION_TYPE_OPTIONS, INSULATION_THICKNESS_OPTIONS,
  ROOF_TYPE_OPTIONS, ROOF_THICKNESS_OPTIONS, ROOF_INSULATION_CHOICE_OPTIONS,
  ROOF_INSULATION_TYPE_OPTIONS, WINDOW_FRAME_OPTIONS, WINDOW_GLASS_OPTIONS,
  getSmartDefaults,
} from "./constants";

function generateId() { return Math.random().toString(36).substring(2, 11); }

export function useChatFlow() {
  const router = useRouter();
  const [step, setStep] = useState<ChatStep>("select_type");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [data, setData] = useState<ChatData>({});
  const [citySearch, setCitySearch] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (step === "select_type" && messages.length === 0) {
      addBotMessage(
        "你好！我是睿筑评估助手 🏠\n\n我来帮你评估你的建筑保温节能情况。整个过程大约2分钟，只需要回答几个简单的问题就行。\n\n请问你想评估哪方面？",
        [
          { text: "保温节能", value: "energy" },
          { text: "隔音效果（即将上线）", value: "acoustic", disabled: true },
        ]
      );
    }
  }, []);

  const addBotMessage = (text: string, quickReplies?: QuickReply[], options?: { showInput?: boolean; showSubmit?: boolean; showPhotoUpload?: boolean }) => {
    setMessages((prev) => [...prev, { id: generateId(), type: "bot", text, quickReplies, ...options }]);
  };

  const addUserMessage = (text: string) => {
    setMessages((prev) => [...prev, { id: generateId(), type: "user", text }]);
  };

  const updateData = (updates: Partial<ChatData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const cityResults = citySearch.length > 0
    ? CITIES.filter((c) => c.name.includes(citySearch) || c.province.includes(citySearch)).slice(0, 8)
    : [];

  const handleCitySelect = (city: typeof CITIES[0]) => {
    setCitySearch("");
    setShowCityDropdown(false);
    addUserMessage(city.name);
    updateData({ city: city.name, climateZone: city.zone });
    setStep("building_type");
    addBotMessage(`${city.name}，了解了！\n\n你的房子是哪种类型？`, BUILDING_TYPE_OPTIONS);
  };

  const handleQuickReply = (reply: QuickReply) => {
    addUserMessage(reply.text);
    const value = reply.value;

    switch (step) {
      case "select_type":
        if (value === "energy") {
          setStep("city");
          addBotMessage("好的，我们来评估保温节能！\n\n你的房子在哪个城市？（比如：长沙、北京、上海）", [], { showInput: true });
          setTimeout(() => inputRef.current?.focus(), 100);
        }
        break;

      case "building_type":
        updateData({ buildingType: value as BuildingType });
        if (value === "residential") {
          setStep("residential_subtype");
          addBotMessage("是哪种住宅呢？", RESIDENTIAL_SUBTYPE_OPTIONS);
        } else {
          setStep("year");
          addBotMessage("大概是哪年建成的？\n不同年代的建筑执行不同的国家节能标准，这会影响评估结果。", YEAR_OPTIONS);
        }
        break;

      case "residential_subtype":
        updateData({ residentialSubtype: value });
        setStep("year");
        addBotMessage("了解了！\n\n房子大概是哪年建成的？\n不同年代的建筑执行不同的国家节能标准，这会影响评估结果。", YEAR_OPTIONS);
        break;

      case "year":
        updateData({ year: value });
        setStep("wall_choice");
        addBotMessage("好的！\n\n关于外墙，你了解外墙的保温情况吗？\n如果不确定，我会根据当地的常见做法帮你估算。", [
          { text: "我知道外墙材料", value: "know_wall" },
          { text: "不确定，帮我估算", value: "estimate_wall" },
          { text: "📷 拍照让我看看", value: "photo_wall" },
        ]);
        break;

      case "wall_choice":
        if (value === "know_wall") {
          updateData({ wallChoice: "know" });
          setStep("wall_type");
          addBotMessage("请选择你的外墙主体是什么材料？", WALL_TYPE_OPTIONS);
        } else if (value === "estimate_wall" || value === "photo_wall") {
          updateData({ wallChoice: "estimate" });
          if (value === "photo_wall") {
            addBotMessage("📷 照片已收到，我会根据照片帮你判断。\n\n现在继续了解屋面情况～");
          } else {
            addBotMessage("好的，我会根据当地常见做法帮你估算外墙参数。\n\n现在继续了解屋面情况～");
          }
          setStep("roof_choice");
          addBotMessage("那屋顶呢？了解屋面的保温情况吗？", [
            { text: "我知道屋面材料", value: "know_roof" },
            { text: "不确定，帮我估算", value: "estimate_roof" },
            { text: "📷 拍照让我看看", value: "photo_roof" },
          ]);
        }
        break;

      case "wall_type":
        updateData({ wallType: value });
        setStep("wall_thickness");
        const wallThicknessOpts = WALL_THICKNESS_OPTIONS[value] || [{ text: "200mm", value: "200" }];
        addBotMessage("墙大概有多厚？", wallThicknessOpts);
        break;

      case "wall_thickness":
        updateData({ wallThickness: parseInt(value) });
        setStep("wall_insulation_choice");
        addBotMessage("外墙有没有做保温层？", WALL_INSULATION_CHOICE_OPTIONS);
        break;

      case "wall_insulation_choice":
        if (value === "yes") {
          updateData({ wallInsulationChoice: "yes" });
          setStep("wall_insulation_type");
          addBotMessage("保温层是什么材料？", WALL_INSULATION_TYPE_OPTIONS);
        } else if (value === "no") {
          updateData({ wallInsulationChoice: "no", wallInsulation: "none" });
          setStep("roof_choice");
          addBotMessage("好的，没有保温层。\n\n现在继续了解屋面情况～");
          addBotMessage("那屋顶呢？了解屋面的保温情况吗？", [
            { text: "我知道屋面材料", value: "know_roof" },
            { text: "不确定，帮我估算", value: "estimate_roof" },
            { text: "📷 拍照让我看看", value: "photo_roof" },
          ]);
        } else {
          updateData({ wallInsulationChoice: "estimate" });
          addBotMessage("好的，我会帮你估算保温层参数。\n\n现在继续了解屋面情况～");
          setStep("roof_choice");
          addBotMessage("那屋顶呢？了解屋面的保温情况吗？", [
            { text: "我知道屋面材料", value: "know_roof" },
            { text: "不确定，帮我估算", value: "estimate_roof" },
            { text: "📷 拍照让我看看", value: "photo_roof" },
          ]);
        }
        break;

      case "wall_insulation_type":
        if (value === "other") {
          updateData({ wallInsulationChoice: "estimate" });
          addBotMessage("好的，我会帮你估算保温层参数。");
        } else {
          updateData({ wallInsulation: value });
          setStep("wall_insulation_thickness");
          addBotMessage("保温层大概多厚？", INSULATION_THICKNESS_OPTIONS);
        }
        break;

      case "wall_insulation_thickness":
        updateData({ wallInsulationThickness: parseInt(value) });
        setStep("roof_choice");
        addBotMessage("好的！\n\n现在继续了解屋面情况～");
        addBotMessage("那屋顶呢？了解屋面的保温情况吗？", [
          { text: "我知道屋面材料", value: "know_roof" },
          { text: "不确定，帮我估算", value: "estimate_roof" },
          { text: "📷 拍照让我看看", value: "photo_roof" },
        ]);
        break;

      case "roof_choice":
        if (value === "know_roof") {
          updateData({ roofChoice: "know" });
          setStep("roof_type");
          addBotMessage("请选择屋面是什么材料？", ROOF_TYPE_OPTIONS);
        } else if (value === "estimate_roof" || value === "photo_roof") {
          updateData({ roofChoice: "estimate" });
          if (value === "photo_roof") {
            addBotMessage("📷 照片已收到，我会根据照片帮你判断。\n\n最后，关于窗户～");
          } else {
            addBotMessage("好的，我会根据当地常见做法帮你估算屋面参数。\n\n最后，关于窗户～");
          }
          setStep("window_frame");
          addBotMessage("窗户是什么材质的框？", WINDOW_FRAME_OPTIONS);
        }
        break;

      case "roof_type":
        updateData({ roofType: value });
        setStep("roof_thickness");
        const roofThicknessOpts = ROOF_THICKNESS_OPTIONS[value] || [{ text: "120mm", value: "120" }];
        addBotMessage("屋面大概有多厚？", roofThicknessOpts);
        break;

      case "roof_thickness":
        updateData({ roofThickness: parseInt(value) });
        setStep("roof_insulation_choice");
        addBotMessage("屋面有没有做保温层？", ROOF_INSULATION_CHOICE_OPTIONS);
        break;

      case "roof_insulation_choice":
        if (value === "yes") {
          updateData({ roofInsulationChoice: "yes" });
          setStep("roof_insulation_type");
          addBotMessage("屋面保温层是什么材料？", ROOF_INSULATION_TYPE_OPTIONS);
        } else if (value === "no") {
          updateData({ roofInsulationChoice: "no", roofInsulation: "roof_none" });
          setStep("window_frame");
          addBotMessage("好的，没有保温层。\n\n最后，关于窗户～");
          addBotMessage("窗户是什么材质的框？", WINDOW_FRAME_OPTIONS);
        } else {
          updateData({ roofInsulationChoice: "estimate" });
          addBotMessage("好的，我会帮你估算保温层参数。\n\n最后，关于窗户～");
          setStep("window_frame");
          addBotMessage("窗户是什么材质的框？", WINDOW_FRAME_OPTIONS);
        }
        break;

      case "roof_insulation_type":
        if (value === "other") {
          updateData({ roofInsulationChoice: "estimate" });
          addBotMessage("好的，我会帮你估算保温层参数。");
        } else {
          updateData({ roofInsulation: value });
          setStep("roof_insulation_thickness");
          addBotMessage("屋面保温层大概多厚？", INSULATION_THICKNESS_OPTIONS);
        }
        break;

      case "roof_insulation_thickness":
        updateData({ roofInsulationThickness: parseInt(value) });
        setStep("window_frame");
        addBotMessage("好的！\n\n最后，关于窗户～");
        addBotMessage("窗户是什么材质的框？", WINDOW_FRAME_OPTIONS);
        break;

      case "window_frame":
        updateData({ windowFrame: value });
        setStep("window_glass");
        addBotMessage("是单层玻璃还是双层/多层？", WINDOW_GLASS_OPTIONS);
        break;

      case "window_glass":
        updateData({ windowGlass: value });
        setStep("summary");
        showSummary();
        break;
    }
  };

  const showSummary = () => {
    const cityName = data.city || "";
    const zone = data.climateZone ? CLIMATE_ZONE_LABELS[data.climateZone] : "未知";
    const bType = data.buildingType ? BUILDING_TYPES.find((b) => b.id === data.buildingType)?.name : "未知";
    const wallType = data.wallType ? WALL_TYPES.find((w) => w.id === data.wallType)?.name : "根据当地常见做法估算";
    const roofType = data.roofType ? ROOF_TYPES.find((r) => r.id === data.roofType)?.name : "根据当地常见做法估算";

    let windowDesc = "";
    if (data.windowFrame && data.windowGlass) {
      const frameName = data.windowFrame === "unknown" ? "不确定材质" :
        data.windowFrame === "alu" ? "铝合金" :
        data.windowFrame === "bridge_alu" ? "断桥铝" :
        data.windowFrame === "upvc" ? "塑钢" : "木框";
      const glassName = data.windowGlass === "unknown" ? "不确定玻璃" :
        data.windowGlass === "single" ? "单层玻璃" :
        data.windowGlass === "double" ? "双层中空" : "三层玻璃";
      windowDesc = `${frameName}框 + ${glassName}`;
    } else {
      windowDesc = "根据当地常见做法估算";
    }

    addBotMessage(
      `太好了！我已收集好所有信息：\n\n📍 城市：${cityName}（${zone}）\n🏠 类型：${bType}\n📅 年代：${YEAR_LABELS[data.year || ""] || "不确定"}\n🧱 外墙：${wallType}\n🏠 屋面：${roofType}\n🪟 外窗：${windowDesc}\n\n点击下方按钮，立即生成评估报告！`,
      [],
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
    const wallThickness = data.wallThickness || defaults.wallThickness;
    const wallInsId = data.wallInsulation || defaults.wallInsulation;
    const wallInsThick = data.wallInsulationThickness || defaults.wallInsulationThickness;
    const roofTypeId = data.roofType || defaults.roofType;
    const roofThickness = data.roofThickness || defaults.roofThickness;
    const roofInsId = data.roofInsulation || defaults.roofInsulation;
    const roofInsThick = data.roofInsulationThickness || defaults.roofInsulationThickness;

    // 根据窗框和玻璃类型匹配窗户配置
    let windowCfgId = defaults.windowConfig;
    if (data.windowFrame && data.windowGlass) {
      const frame = data.windowFrame;
      const glass = data.windowGlass;
      if (frame === "bridge_alu" && glass === "double") windowCfgId = "double_bridge_alu";
      else if (frame === "bridge_alu" && glass === "triple") windowCfgId = "triple_bridge_low_e";
      else if (frame === "upvc" && glass === "double") windowCfgId = "upvc_double";
      else if (frame === "upvc" && glass === "triple") windowCfgId = "upvc_low_e";
      else if (frame === "wood" && glass === "double") windowCfgId = "wood_double";
      else if (frame === "alu" && glass === "single") windowCfgId = "single_alu";
      else if (frame === "alu" && glass === "double") windowCfgId = "double_alu";
      else if (glass === "single") windowCfgId = "single_alu";
      else if (glass === "double") windowCfgId = "double_bridge_alu";
      else windowCfgId = "double_bridge_alu";
    }

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

  return {
    step, messages, data, citySearch, setCitySearch, showCityDropdown, setShowCityDropdown,
    cityResults, messagesEndRef, inputRef, addBotMessage, addUserMessage, updateData,
    handleQuickReply, handleSubmit, handleInputSubmit, handleCitySelect,
  };
}
