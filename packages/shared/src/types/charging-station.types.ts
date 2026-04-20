export interface ChargingStation {
  id: string;
  name: string;
  name_ar?: string;
  provider?: string;
  charger_type: string;
  power_kw?: number;
  city_id?: string;
  city?: { id: string; name: string; name_ar?: string };
  address?: string;
  latitude?: number;
  longitude?: number;
  opening_hours?: string;
  image_urls?: string[];
  is_active: boolean;
  is_verified: boolean;
  notes?: string;
  created_at: string;
}
