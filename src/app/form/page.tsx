"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CITIES, CLIMATE_ZONE_LABELS, type ClimateZone } from "@/lib/data/climate";
import { BUILDING_TYPES, type BuildingType } from "@/lib/data/building-types";
import {
  WALL_MATERIALS,
  INSULATION_MATERIALS,
  ROOF_MATERIALS,
  ROOF_INSULATION_MATERIALS,
  WINDOW_CONFIGS,
  getInsulationThicknesses,
} from "@/lib/data/materials";
import type { FormData, EvaluationResult } from "@/lib/types";
import {
  calculateWallK,
  calculateRoofK,
  calculateRating,
  estimateHeatLoss,
} from "@/lib/engine/calculator";
import { getStandardLimits } from "@/lib/data/standards";
import { getBuildingType } from "@/lib/data/building-types";

const STEPS = ["城市", "建筑类型", "外墙", "屋面", "外窗"];

export default function FormPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"right" | "left">("right");
  const [validationError, setValidationError] = useState("");
  const [formData, setFormData] = useState<FormData>({
    city: "",
    climateZone: null,
    buildingType: null,
    wallBase: "",
    wallInsulation: "",
    wallInsulationThickness: 50,
    roofBase: "",
    roofInsulation: "",
    roofInsulationThickness: 50,
    windowConfig: "",
  });

  const updateField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setValidationError("");
  }, []);

  const getValidationError = (): string => {
    switch (step) {
      case 0: return !formData.city ? "请选择城市" : "";
      case 1: return !formData.buildingType ? "请选择建筑类型" : "";
      case 2:
        if (!formData.wallBase) return "请选择基层墙体";
        if (!formData.wallInsulation) return "请选择保温层材料";
        if (formData.wallInsulation !== "none" && !formData.wallInsulationThickness) return "请选择保温层厚度";
        return "";
      case 3:
        if (!formData.roofBase) return "请选择屋面基层";
        if (!formData.roofInsulation) return "请选择屋面保温层材料";
        if (formData.roofInsulation !== "roof_none" && !formData.roofInsulationThickness) return "请选择保温层厚度";
        return "";
      case 4: return !formData.windowConfig ? "请选择外窗类型" : "";
      default: return "";
    }
  };

  const nextStep = () => {
    const error = getValidationError();
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError("");
    if (step < 4) { setDirection("right"); setStep((s) => s + 1); }
  };
  const prevStep = () => {
    if (step > 0) { setDirection("left"); setStep((s) => s - 1); }
  };

  const handleSubmit = () => {
    const error = getValidationError();
    if (error) {
      setValidationError(error);
      return;
    }
    if (!formData.city || !formData.climateZone || !formData.buildingType) return;

    const zone = formData.climateZone;
    const bType = formData.buildingType;
    const limits = getStandardLimits(zone, bType);
    const bInfo = getBuildingType(bType);

    const wallBase = WALL_MATERIALS.find((m) => m.id === formData.wallBase)!;
    const wallIns = INSULATION_MATERIALS.find((m) => m.id === formData.wallInsulation)!;
    const wallResult = calculateWallK({
      baseLayer: wallBase,
      insulationLayer: wallIns,
      insulationThickness: formData.wallInsulationThickness,
    });

    const roofBase = ROOF_MATERIALS.find((m) => m.id === formData.roofBase)!;
    const roofIns = ROOF_INSULATION_MATERIALS.find((m) => m.id === formData.roofInsulation)!;
    const roofResult = calculateRoofK({
      baseLayer: roofBase,
      insulationLayer: roofIns,
      insulationThickness: formData.roofInsulationThickness,
    });

    const windowCfg = WINDOW_CONFIGS.find((w) => w.id === formData.windowConfig)!;

    const ratingResult = calculateRating(
      wallResult.kValue, roofResult.kValue, windowCfg.kValue,
      limits.wallK, limits.roofK, limits.windowK
    );

    const heatLoss = estimateHeatLoss(
      wallResult.kValue, roofResult.kValue, windowCfg.kValue,
      bInfo.wallAreaRatio, bInfo.roofAreaRatio, bInfo.windowRatio
    );

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

    sessionStorage.setItem("evaluationForm", JSON.stringify(formData));
    sessionStorage.setItem("evaluationResult", JSON.stringify(result));
    router.push("/report");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-[#0f172a]/95 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.push("/")} className="text-slate-400 hover:text-slate-200 text-sm flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </button>
          <h1 className="text-sm font-medium text-slate-300">建筑信息填写</h1>
          <span className="text-xs text-slate-500 font-mono">{step + 1}/5</span>
        </div>
        <div className="h-0.5 bg-slate-800">
          <div className="h-full bg-blue-500 transition-all duration-300 ease-out" style={{ width: `${((step + 1) / 5) * 100}%` }} />
        </div>
      </header>

      <div className="max-w-lg mx-auto w-full px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200 ${
                  i < step ? "bg-blue-500 text-white" : i === step ? "bg-blue-500/20 text-blue-400 border border-blue-500/50" : "bg-slate-800 text-slate-500 border border-slate-700"
                }`}>
                  {i < step ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : i + 1}
                </div>
                <span className={`text-[10px] mt-1 ${i <= step ? "text-slate-300" : "text-slate-600"}`}>{label}</span>
              </div>
              {i < 4 && <div className={`w-6 sm:w-10 h-px mx-0.5 mt-[-12px] ${i < step ? "bg-blue-500" : "bg-slate-700"}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-4">
        <div className={direction === "right" ? "animate-slide-right" : "animate-slide-left"} key={step}>
          {step === 0 && <StepCity formData={formData} updateField={updateField} />}
          {step === 1 && <StepBuildingType formData={formData} updateField={updateField} />}
          {step === 2 && <StepWall formData={formData} updateField={updateField} />}
          {step === 3 && <StepRoof formData={formData} updateField={updateField} />}
          {step === 4 && <StepWindow formData={formData} updateField={updateField} />}
        </div>
      </div>

      <div className="sticky bottom-0 bg-[#0f172a]/95 backdrop-blur-sm border-t border-slate-700/50">
        {validationError && (
          <div className="px-4 pt-2">
            <p className="text-xs text-amber-400 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {validationError}
            </p>
          </div>
        )}
        <div className="max-w-lg mx-auto px-4 py-3 flex gap-3">
          {step > 0 && (
            <button onClick={prevStep} className="flex-1 px-4 py-3 rounded-lg border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors">
              上一步
            </button>
          )}
          {step < 4 ? (
            <button onClick={nextStep} className="flex-1 px-4 py-3 rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium transition-all">
              下一步
            </button>
          ) : (
            <button onClick={handleSubmit} className="flex-1 px-4 py-3 rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium transition-all">
              生成评估报告
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========== Step Components ========== */

interface StepProps {
  formData: FormData;
  updateField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}

function StepCity({ formData, updateField }: StepProps) {
  const [search, setSearch] = useState("");
  const [selectedZone, setSelectedZone] = useState<ClimateZone | null>(null);

  const zones = useMemo(() => Object.entries(CLIMATE_ZONE_LABELS) as [ClimateZone, string][], []);

  const filteredCities = useMemo(() => {
    return CITIES.filter((c) => {
      const matchZone = !selectedZone || c.zone === selectedZone;
      const matchSearch = !search || c.name.includes(search);
      return matchZone && matchSearch;
    });
  }, [search, selectedZone]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-100 mb-1">选择城市</h2>
        <p className="text-xs text-slate-400">系统将自动匹配气候分区和标准限值</p>
      </div>
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" placeholder="搜索城市名称..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setSelectedZone(null)} className={`px-2.5 py-1 rounded-md text-xs transition-colors ${!selectedZone ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600"}`}>全部</button>
        {zones.map(([key, label]) => (
          <button key={key} onClick={() => setSelectedZone(key)} className={`px-2.5 py-1 rounded-md text-xs transition-colors ${selectedZone === key ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600"}`}>{label}</button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 max-h-[40vh] overflow-y-auto">
        {filteredCities.map((city) => (
          <button key={city.name + city.province} onClick={() => { updateField("city", city.name); updateField("climateZone", city.zone); }}
            className={`px-3 py-2.5 rounded-lg text-sm text-center transition-all ${formData.city === city.name ? "bg-blue-500/20 text-blue-400 border border-blue-500/40" : "bg-slate-800/60 text-slate-300 border border-slate-700/50 hover:border-slate-600"}`}>
            {city.name}
          </button>
        ))}
      </div>
      {formData.city && (
        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
          <p className="text-xs text-slate-400">已选城市: <span className="text-blue-400 font-medium">{formData.city}</span></p>
          <p className="text-xs text-slate-500 mt-1">气候分区: {formData.climateZone ? CLIMATE_ZONE_LABELS[formData.climateZone as ClimateZone] : ""}</p>
        </div>
      )}
    </div>
  );
}

function StepBuildingType({ formData, updateField }: StepProps) {
  const icons: Record<string, React.ReactNode> = {
    home: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    building: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    bed: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v11a1 1 0 001 1h16a1 1 0 001-1V7M3 7l3-3h12l3 3M8 11h8M8 15h8" /></svg>,
    factory: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 21V7l4-4v4l4-4v4l4-4v14M4 21h16" /></svg>,
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-100 mb-1">选择建筑类型</h2>
        <p className="text-xs text-slate-400">不同建筑类型对应不同的节能标准要求</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {BUILDING_TYPES.map((bt) => (
          <button key={bt.id} onClick={() => updateField("buildingType", bt.id)}
            className={`p-4 rounded-xl text-left transition-all ${formData.buildingType === bt.id ? "bg-blue-500/15 border-blue-500/40 border" : "bg-slate-800/60 border-slate-700/50 border hover:border-slate-600"}`}>
            <div className={`mb-2 ${formData.buildingType === bt.id ? "text-blue-400" : "text-slate-400"}`}>{icons[bt.icon]}</div>
            <p className={`text-sm font-medium mb-1 ${formData.buildingType === bt.id ? "text-blue-400" : "text-slate-200"}`}>{bt.name}</p>
            <p className="text-[11px] text-slate-500 leading-tight">{bt.description}</p>
          </button>
        ))}
      </div>
      {formData.buildingType && (() => {
        const info = getBuildingType(formData.buildingType);
        return (
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <p className="text-xs text-slate-400 mb-2">建筑参数参考值:</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><p className="text-xs text-slate-500">窗墙比</p><p className="text-sm font-mono text-slate-300">{(info.windowRatio * 100).toFixed(0)}%</p></div>
              <div><p className="text-xs text-slate-500">墙地比</p><p className="text-sm font-mono text-slate-300">{info.wallAreaRatio.toFixed(1)}</p></div>
              <div><p className="text-xs text-slate-500">屋面比</p><p className="text-sm font-mono text-slate-300">{info.roofAreaRatio.toFixed(2)}</p></div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function StepWall({ formData, updateField }: StepProps) {
  const selectedBase = WALL_MATERIALS.find((m) => m.id === formData.wallBase);
  const selectedIns = INSULATION_MATERIALS.find((m) => m.id === formData.wallInsulation);
  const thicknesses = selectedIns ? getInsulationThicknesses(selectedIns.id) : [30,40,50,60,80,100];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-100 mb-1">外墙构造</h2>
        <p className="text-xs text-slate-400">选择基层墙体和保温层材料</p>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-400 mb-2 block">基层墙体</label>
        <div className="space-y-1.5 max-h-[22vh] overflow-y-auto">
          {WALL_MATERIALS.map((m) => (
            <button key={m.id} onClick={() => updateField("wallBase", m.id)}
              className={`w-full px-3 py-2.5 rounded-lg text-left text-sm transition-all flex justify-between items-center ${formData.wallBase === m.id ? "bg-blue-500/15 border border-blue-500/40 text-blue-400" : "bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:border-slate-600"}`}>
              <span>{m.name}</span>
              <span className="text-xs text-slate-500 font-mono">λ={m.lambda}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-400 mb-2 block">保温层材料</label>
        <div className="space-y-1.5 max-h-[22vh] overflow-y-auto">
          {INSULATION_MATERIALS.map((m) => (
            <button key={m.id} onClick={() => { updateField("wallInsulation", m.id); if (m.commonThicknesses) updateField("wallInsulationThickness", m.commonThicknesses[2] || 50); }}
              className={`w-full px-3 py-2.5 rounded-lg text-left text-sm transition-all flex justify-between items-center ${formData.wallInsulation === m.id ? "bg-blue-500/15 border border-blue-500/40 text-blue-400" : "bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:border-slate-600"}`}>
              <span>{m.name}</span>
              <span className="text-xs text-slate-500 font-mono">{m.id === "none" ? "-" : `λ=${m.lambda}`}</span>
            </button>
          ))}
        </div>
      </div>
      {formData.wallInsulation && formData.wallInsulation !== "none" && (
        <div>
          <label className="text-xs font-medium text-slate-400 mb-1 block">
            保温层厚度 <span className="text-amber-400">*</span>
          </label>
          <p className="text-[10px] text-slate-500 mb-2">常见厚度: {thicknesses.join(" / ")} mm</p>
          <div className="flex flex-wrap gap-2">
            {thicknesses.map((t) => (
              <button key={t} onClick={() => updateField("wallInsulationThickness", t)}
                className={`px-3 py-2 rounded-lg text-sm font-mono transition-all ${formData.wallInsulationThickness === t ? "bg-blue-500/20 text-blue-400 border border-blue-500/40 ring-1 ring-blue-500/30" : "bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:border-slate-600"}`}>
                {t}mm
              </button>
            ))}
          </div>
          {!formData.wallInsulationThickness && (
            <p className="text-[10px] text-amber-400 mt-1.5">请选择保温层厚度</p>
          )}
        </div>
      )}
      {selectedBase && selectedIns && (
        <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <p className="text-xs text-slate-400 mb-2">构造预览:</p>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded">{selectedBase.name}</span>
            {selectedIns.id !== "none" && <>
              <span className="text-slate-600">+</span>
              <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded">{selectedIns.name} {formData.wallInsulationThickness}mm</span>
            </>}
          </div>
        </div>
      )}
    </div>
  );
}

function StepRoof({ formData, updateField }: StepProps) {
  const selectedBase = ROOF_MATERIALS.find((m) => m.id === formData.roofBase);
  const selectedIns = ROOF_INSULATION_MATERIALS.find((m) => m.id === formData.roofInsulation);
  const thicknesses = selectedIns ? getInsulationThicknesses(selectedIns.id) : [40,50,60,80,100];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-100 mb-1">屋面构造</h2>
        <p className="text-xs text-slate-400">选择屋面基层和保温层材料</p>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-400 mb-2 block">屋面基层</label>
        <div className="space-y-1.5">
          {ROOF_MATERIALS.map((m) => (
            <button key={m.id} onClick={() => updateField("roofBase", m.id)}
              className={`w-full px-3 py-2.5 rounded-lg text-left text-sm transition-all flex justify-between items-center ${formData.roofBase === m.id ? "bg-blue-500/15 border border-blue-500/40 text-blue-400" : "bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:border-slate-600"}`}>
              <span>{m.name}</span>
              <span className="text-xs text-slate-500 font-mono">λ={m.lambda}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-400 mb-2 block">屋面保温层</label>
        <div className="space-y-1.5 max-h-[22vh] overflow-y-auto">
          {ROOF_INSULATION_MATERIALS.map((m) => (
            <button key={m.id} onClick={() => { updateField("roofInsulation", m.id); if (m.commonThicknesses) updateField("roofInsulationThickness", m.commonThicknesses[2] || 50); }}
              className={`w-full px-3 py-2.5 rounded-lg text-left text-sm transition-all flex justify-between items-center ${formData.roofInsulation === m.id ? "bg-blue-500/15 border border-blue-500/40 text-blue-400" : "bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:border-slate-600"}`}>
              <span>{m.name}</span>
              <span className="text-xs text-slate-500 font-mono">{m.id === "roof_none" ? "-" : `λ=${m.lambda}`}</span>
            </button>
          ))}
        </div>
      </div>
      {formData.roofInsulation && formData.roofInsulation !== "roof_none" && (
        <div>
          <label className="text-xs font-medium text-slate-400 mb-1 block">
            保温层厚度 <span className="text-amber-400">*</span>
          </label>
          <p className="text-[10px] text-slate-500 mb-2">常见厚度: {thicknesses.join(" / ")} mm</p>
          <div className="flex flex-wrap gap-2">
            {thicknesses.map((t) => (
              <button key={t} onClick={() => updateField("roofInsulationThickness", t)}
                className={`px-3 py-2 rounded-lg text-sm font-mono transition-all ${formData.roofInsulationThickness === t ? "bg-blue-500/20 text-blue-400 border border-blue-500/40 ring-1 ring-blue-500/30" : "bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:border-slate-600"}`}>
                {t}mm
              </button>
            ))}
          </div>
          {!formData.roofInsulationThickness && (
            <p className="text-[10px] text-amber-400 mt-1.5">请选择保温层厚度</p>
          )}
        </div>
      )}
      {selectedBase && selectedIns && (
        <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <p className="text-xs text-slate-400 mb-2">构造预览:</p>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded">{selectedBase.name}</span>
            {selectedIns.id !== "roof_none" && <>
              <span className="text-slate-600">+</span>
              <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded">{selectedIns.name} {formData.roofInsulationThickness}mm</span>
            </>}
          </div>
        </div>
      )}
    </div>
  );
}

function StepWindow({ formData, updateField }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-100 mb-1">外窗配置</h2>
        <p className="text-xs text-slate-400">选择外窗类型，不同配置对应不同传热系数</p>
      </div>
      <div className="space-y-2 max-h-[55vh] overflow-y-auto">
        {WINDOW_CONFIGS.map((w) => (
          <button key={w.id} onClick={() => updateField("windowConfig", w.id)}
            className={`w-full p-3 rounded-lg text-left transition-all ${formData.windowConfig === w.id ? "bg-blue-500/15 border border-blue-500/40" : "bg-slate-800/60 border border-slate-700/50 hover:border-slate-600"}`}>
            <div className="flex justify-between items-start mb-1">
              <span className={`text-sm font-medium ${formData.windowConfig === w.id ? "text-blue-400" : "text-slate-200"}`}>{w.name}</span>
              <span className="text-sm font-mono text-blue-400">K={w.kValue}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="text-[10px] px-1.5 py-0.5 bg-slate-700/50 text-slate-400 rounded">{w.frameMaterial}</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-slate-700/50 text-slate-400 rounded">{w.layers}层玻璃</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-slate-700/50 text-slate-400 rounded">{w.glassType}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">{w.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
