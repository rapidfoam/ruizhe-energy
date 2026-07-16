// ChatAssess Types
import type { ClimateZone } from "@/lib/data/climate";
import type { BuildingType } from "@/lib/data/building-types";
import type { FormData } from "@/lib/types";

export interface QuickReply {
  text: string;
  value: string;
  disabled?: boolean;
}

export interface ChatMessage {
  id: string;
  type: "bot" | "user";
  text: string;
  quickReplies?: QuickReply[];
  showInput?: boolean;
  showSubmit?: boolean;
}

export type ChatStep =
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

export interface SmartDefaults {
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

export interface ChatData extends Partial<FormData> {
  year?: string;
  wallChoice?: "know" | "estimate";
  roofChoice?: "know" | "estimate";
}

export type { ClimateZone, BuildingType };
