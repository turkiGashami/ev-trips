export interface CarBrand {
  id: string;
  name: string;
  name_ar?: string;
  slug: string;
  logo_url?: string;
  is_active: boolean;
}

export interface CarModel {
  id: string;
  brand_id: string;
  brand?: CarBrand;
  name: string;
  name_ar?: string;
  slug: string;
  is_active: boolean;
}

export interface CarTrim {
  id: string;
  model_id: string;
  model?: CarModel;
  name: string;
  name_ar?: string;
  battery_capacity_kwh?: number;
  range_km_official?: number;
  drivetrain?: string;
  is_active: boolean;
}

export interface VehicleSnapshot {
  brand: string;
  model: string;
  trim?: string;
  year: number;
  batteryCapacityKwh?: number;
  rangeKmOfficial?: number;
  drivetrain?: string;
}

export interface UserVehicle {
  id: string;
  user_id: string;
  brand_id: string;
  model_id: string;
  trim_id?: string;
  year: number;
  nickname?: string;
  image_url?: string;
  battery_capacity_kwh?: number;
  drivetrain?: string;
  is_default: boolean;
  brand?: CarBrand;
  model?: CarModel;
  trim?: CarTrim;
  created_at: string;
  updated_at: string;
}
