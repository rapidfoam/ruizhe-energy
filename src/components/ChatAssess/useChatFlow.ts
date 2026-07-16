// ChatAssess useChatFlow Hook
"use client";

import { useState, useCallback } from "react";
import { WALL_TYPES, INSULATION_MATERIALS, ROOF_TYPES } from "@/lib/data/materials";
import type { ChatMessage, ChatStep, ChatData, QuickReply } from "./types";

export function useChatFlow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState<ChatStep>("select_type");
  const [data, setData] = useState<ChatData>({});

  const genId = () => Math.random().toString(36).slice(2, 10);

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

  const addUserMessage = useCallback((text: string) => {
    const msg: ChatMessage = {
      id: genId(),
      type: "user",
      text,
    };
    setMessages((prev) => [...prev, msg]);
  }, []);

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
        const bType = value === "other" ? "residential" : value as ChatData["buildingType"];
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
        setData((prev) => ({ ...prev, year: value }));
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
          setData((prev) => ({ ...prev, wallChoice: "estimate" }));
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
          setData((prev) => ({ ...prev, wallChoice: "know" }));
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
          setData((prev) => ({ ...prev, roofChoice: "estimate" }));
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
          setData((prev) => ({ ...prev, roofChoice: "know" }));
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
        break;
      }
    }
  };

  return {
    messages,
    step,
    data,
    setData,
    addBotMessage,
    addUserMessage,
    processStep,
  };
}
