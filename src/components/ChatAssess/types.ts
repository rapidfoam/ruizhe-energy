// ChatAssess Types - v2
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
  showNumericInput?: boolean;
  numericPlaceholder?: string;
  showSubmit?: boolean;
  showPhotoUpload?: boolean;
}

export type ChatStep =
  | "select_type"
  | "city"
  | "building_type"
  | "residential_subtype"
  | "building_area"
  | "building_floors"
  | "year"
  | "wall_choice"
  | "wall_type"
  | "wall_thickness"
  | "wall_insulation_choice"
  | "wall_insulation_type"
  | "wall_insulation_thickness"
  | "roof_choice"
  | "roof_type"
  | "roof_thickness"
  | "roof_insulation_choice"
  | "roof_insulation_type"
  | "roof_insulation_thickness"
  | "window_frame"
  | "window_glass"
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
  wallInsulationChoice?: "yes" | "no" | "estimate";
  roofInsulationChoice?: "yes" | "no" | "estimate";
  residentialSubtype?: string;
  windowFrame?: string;
  windowGlass?: string;
}
