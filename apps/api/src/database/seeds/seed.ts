/**
 * EV Trips Community Platform — Database Seed Script
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/database/seeds/seed.ts
 *
 * Requires the DATABASE_URL environment variable (or individual DB_ vars)
 * to be set before running.
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import {
  User,
  CarBrand,
  CarModel,
  CarTrim,
  City,
  Route,
  ChargingStation,
  Badge,
  StaticPage,
  SystemSetting,
} from '../../entities';
import {
  UserRole,
  UserStatus,
  DrivetrainType,
  ChargerType,
  PageStatus,
} from '../../common/enums';

// ---------------------------------------------------------------------------
// Data Source
// ---------------------------------------------------------------------------
const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'ev_trips',
  entities: [__dirname + '/../../entities/*.entity{.ts,.js}'],
  synchronize: false,
  logging: false,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

// ---------------------------------------------------------------------------
// Seed Functions
// ---------------------------------------------------------------------------

async function seedCities(ds: DataSource): Promise<Map<string, City>> {
  const repo = ds.getRepository(City);
  const cities = [
    { name: 'Riyadh',     name_ar: 'الرياض',        slug: 'riyadh',     country: 'SA', latitude: 24.7136, longitude: 46.6753 },
    { name: 'Jeddah',     name_ar: 'جدة',            slug: 'jeddah',     country: 'SA', latitude: 21.4858, longitude: 39.1925 },
    { name: 'Mecca',      name_ar: 'مكة المكرمة',    slug: 'mecca',      country: 'SA', latitude: 21.3891, longitude: 39.8579 },
    { name: 'Medina',     name_ar: 'المدينة المنورة', slug: 'medina',     country: 'SA', latitude: 24.5247, longitude: 39.5692 },
    { name: 'Dammam',     name_ar: 'الدمام',          slug: 'dammam',     country: 'SA', latitude: 26.4207, longitude: 50.0888 },
    { name: 'Khobar',     name_ar: 'الخبر',           slug: 'khobar',     country: 'SA', latitude: 26.2894, longitude: 50.2033 },
    { name: 'Abha',       name_ar: 'أبها',            slug: 'abha',       country: 'SA', latitude: 18.2164, longitude: 42.5053 },
    { name: 'Tabuk',      name_ar: 'تبوك',            slug: 'tabuk',      country: 'SA', latitude: 28.3838, longitude: 36.5550 },
    { name: 'Taif',       name_ar: 'الطائف',          slug: 'taif',       country: 'SA', latitude: 21.2854, longitude: 40.4145 },
    { name: 'Yanbu',      name_ar: 'ينبع',            slug: 'yanbu',      country: 'SA', latitude: 24.0875, longitude: 38.0583 },
    { name: 'Hail',       name_ar: 'حائل',            slug: 'hail',       country: 'SA', latitude: 27.5219, longitude: 41.7057 },
    { name: 'Jubail',     name_ar: 'الجبيل',          slug: 'jubail',     country: 'SA', latitude: 27.0046, longitude: 49.6580 },
    { name: 'Qassim',     name_ar: 'القصيم',          slug: 'qassim',     country: 'SA', latitude: 26.3260, longitude: 43.9750 },
    { name: 'Najran',     name_ar: 'نجران',           slug: 'najran',     country: 'SA', latitude: 17.4933, longitude: 44.1277 },
    { name: "Al-'Ula",    name_ar: 'العُلا',           slug: 'alula',      country: 'SA', latitude: 26.6079, longitude: 37.9218 },
  ];

  const map = new Map<string, City>();
  for (const data of cities) {
    let city = await repo.findOne({ where: { slug: data.slug } });
    if (!city) {
      city = repo.create(data);
      await repo.save(city);
    }
    map.set(data.slug, city);
  }
  console.log(`  Seeded ${map.size} cities.`);
  return map;
}

async function seedCarBrands(ds: DataSource): Promise<Map<string, CarBrand>> {
  const repo = ds.getRepository(CarBrand);
  const brands = [
    { name: 'Tesla',    name_ar: 'تسلا',   slug: 'tesla',    logo_url: null },
    { name: 'BYD',      name_ar: 'بي واي دي', slug: 'byd',   logo_url: null },
    { name: 'Hyundai',  name_ar: 'هيونداي', slug: 'hyundai', logo_url: null },
    { name: 'Kia',      name_ar: 'كيا',     slug: 'kia',     logo_url: null },
    { name: 'BMW',      name_ar: 'بي ام دبليو', slug: 'bmw', logo_url: null },
    { name: 'Mercedes', name_ar: 'مرسيدس', slug: 'mercedes', logo_url: null },
    { name: 'Audi',     name_ar: 'أودي',   slug: 'audi',     logo_url: null },
    { name: 'Porsche',  name_ar: 'بورش',   slug: 'porsche',  logo_url: null },
    { name: 'Lucid',    name_ar: 'لوسيد',  slug: 'lucid',    logo_url: null },
    { name: 'Rivian',   name_ar: 'ريفيان', slug: 'rivian',   logo_url: null },
    { name: 'NIO',      name_ar: 'نيو',    slug: 'nio',      logo_url: null },
    { name: 'Zeekr',    name_ar: 'زيكر',   slug: 'zeekr',    logo_url: null },
    { name: 'Volkswagen', name_ar: 'فولكسفاغن', slug: 'volkswagen', logo_url: null },
    { name: 'Nissan',   name_ar: 'نيسان',  slug: 'nissan',   logo_url: null },
    { name: 'Chevrolet', name_ar: 'شيفروليه', slug: 'chevrolet', logo_url: null },
  ];

  const map = new Map<string, CarBrand>();
  for (const data of brands) {
    let brand = await repo.findOne({ where: { slug: data.slug } });
    if (!brand) {
      brand = repo.create(data);
      await repo.save(brand);
    }
    map.set(data.slug, brand);
  }
  console.log(`  Seeded ${map.size} car brands.`);
  return map;
}

async function seedCarModelsAndTrims(
  ds: DataSource,
  brands: Map<string, CarBrand>,
): Promise<void> {
  const modelRepo = ds.getRepository(CarModel);
  const trimRepo  = ds.getRepository(CarTrim);

  const modelSeed: Array<{
    brandSlug: string;
    name: string;
    name_ar?: string;
    slug: string;
    trims: Array<{
      name: string;
      name_ar?: string;
      battery_capacity_kwh?: number;
      range_km_official?: number;
      drivetrain?: DrivetrainType;
    }>;
  }> = [
    {
      brandSlug: 'tesla',
      name: 'Model 3',
      name_ar: 'موديل 3',
      slug: 'model-3',
      trims: [
        { name: 'Standard Range RWD', battery_capacity_kwh: 57.5, range_km_official: 491, drivetrain: DrivetrainType.RWD },
        { name: 'Long Range AWD',     battery_capacity_kwh: 82,   range_km_official: 614, drivetrain: DrivetrainType.AWD },
        { name: 'Performance AWD',    battery_capacity_kwh: 82,   range_km_official: 567, drivetrain: DrivetrainType.AWD },
      ],
    },
    {
      brandSlug: 'tesla',
      name: 'Model Y',
      name_ar: 'موديل Y',
      slug: 'model-y',
      trims: [
        { name: 'Standard Range RWD', battery_capacity_kwh: 57.5, range_km_official: 430, drivetrain: DrivetrainType.RWD },
        { name: 'Long Range AWD',     battery_capacity_kwh: 82,   range_km_official: 533, drivetrain: DrivetrainType.AWD },
        { name: 'Performance AWD',    battery_capacity_kwh: 82,   range_km_official: 514, drivetrain: DrivetrainType.AWD },
      ],
    },
    {
      brandSlug: 'tesla',
      name: 'Model S',
      name_ar: 'موديل S',
      slug: 'model-s',
      trims: [
        { name: 'Long Range AWD', battery_capacity_kwh: 100, range_km_official: 637, drivetrain: DrivetrainType.AWD },
        { name: 'Plaid',          battery_capacity_kwh: 100, range_km_official: 600, drivetrain: DrivetrainType.TRI_MOTOR },
      ],
    },
    {
      brandSlug: 'tesla',
      name: 'Model X',
      name_ar: 'موديل X',
      slug: 'model-x',
      trims: [
        { name: 'Long Range AWD', battery_capacity_kwh: 100, range_km_official: 560, drivetrain: DrivetrainType.AWD },
        { name: 'Plaid',          battery_capacity_kwh: 100, range_km_official: 543, drivetrain: DrivetrainType.TRI_MOTOR },
      ],
    },
    {
      brandSlug: 'hyundai',
      name: 'IONIQ 5',
      name_ar: 'أيونيك 5',
      slug: 'ioniq-5',
      trims: [
        { name: 'Standard Range RWD', battery_capacity_kwh: 58,   range_km_official: 384, drivetrain: DrivetrainType.RWD },
        { name: 'Long Range RWD',     battery_capacity_kwh: 77.4, range_km_official: 507, drivetrain: DrivetrainType.RWD },
        { name: 'Long Range AWD',     battery_capacity_kwh: 77.4, range_km_official: 454, drivetrain: DrivetrainType.AWD },
      ],
    },
    {
      brandSlug: 'hyundai',
      name: 'IONIQ 6',
      name_ar: 'أيونيك 6',
      slug: 'ioniq-6',
      trims: [
        { name: 'Standard Range RWD', battery_capacity_kwh: 53,   range_km_official: 429, drivetrain: DrivetrainType.RWD },
        { name: 'Long Range RWD',     battery_capacity_kwh: 77.4, range_km_official: 614, drivetrain: DrivetrainType.RWD },
        { name: 'Long Range AWD',     battery_capacity_kwh: 77.4, range_km_official: 519, drivetrain: DrivetrainType.AWD },
      ],
    },
    {
      brandSlug: 'kia',
      name: 'EV6',
      name_ar: 'إي في 6',
      slug: 'ev6',
      trims: [
        { name: 'Standard Range RWD', battery_capacity_kwh: 58,   range_km_official: 394, drivetrain: DrivetrainType.RWD },
        { name: 'Long Range RWD',     battery_capacity_kwh: 77.4, range_km_official: 528, drivetrain: DrivetrainType.RWD },
        { name: 'Long Range AWD',     battery_capacity_kwh: 77.4, range_km_official: 484, drivetrain: DrivetrainType.AWD },
        { name: 'GT AWD',             battery_capacity_kwh: 77.4, range_km_official: 424, drivetrain: DrivetrainType.AWD },
      ],
    },
    {
      brandSlug: 'kia',
      name: 'EV9',
      name_ar: 'إي في 9',
      slug: 'ev9',
      trims: [
        { name: 'Long Range RWD', battery_capacity_kwh: 99.8, range_km_official: 541, drivetrain: DrivetrainType.RWD },
        { name: 'Long Range AWD', battery_capacity_kwh: 99.8, range_km_official: 505, drivetrain: DrivetrainType.AWD },
      ],
    },
    {
      brandSlug: 'lucid',
      name: 'Air',
      name_ar: 'لوسيد إير',
      slug: 'air',
      trims: [
        { name: 'Pure',         battery_capacity_kwh: 88,  range_km_official: 653, drivetrain: DrivetrainType.RWD },
        { name: 'Touring',      battery_capacity_kwh: 112, range_km_official: 764, drivetrain: DrivetrainType.AWD },
        { name: 'Grand Touring', battery_capacity_kwh: 112, range_km_official: 836, drivetrain: DrivetrainType.AWD },
        { name: 'Sapphire',     battery_capacity_kwh: 118, range_km_official: 724, drivetrain: DrivetrainType.TRI_MOTOR },
      ],
    },
    {
      brandSlug: 'byd',
      name: 'ATTO 3',
      name_ar: 'أتو 3',
      slug: 'atto-3',
      trims: [
        { name: 'Standard Range', battery_capacity_kwh: 49.92, range_km_official: 345, drivetrain: DrivetrainType.FWD },
        { name: 'Long Range',     battery_capacity_kwh: 60.48, range_km_official: 420, drivetrain: DrivetrainType.FWD },
      ],
    },
    {
      brandSlug: 'bmw',
      name: 'iX',
      name_ar: 'آي إكس',
      slug: 'ix',
      trims: [
        { name: 'xDrive40', battery_capacity_kwh: 76.6, range_km_official: 425, drivetrain: DrivetrainType.AWD },
        { name: 'xDrive50', battery_capacity_kwh: 111.5, range_km_official: 630, drivetrain: DrivetrainType.AWD },
        { name: 'M60',      battery_capacity_kwh: 111.5, range_km_official: 566, drivetrain: DrivetrainType.AWD },
      ],
    },
    {
      brandSlug: 'mercedes',
      name: 'EQS',
      name_ar: 'إي كيو إس',
      slug: 'eqs',
      trims: [
        { name: '450+',     battery_capacity_kwh: 107.8, range_km_official: 784, drivetrain: DrivetrainType.RWD },
        { name: '450 4MATIC', battery_capacity_kwh: 107.8, range_km_official: 717, drivetrain: DrivetrainType.AWD },
        { name: 'AMG 53 4MATIC+', battery_capacity_kwh: 107.8, range_km_official: 580, drivetrain: DrivetrainType.AWD },
      ],
    },
    {
      brandSlug: 'volkswagen',
      name: 'ID.4',
      name_ar: 'آي دي 4',
      slug: 'id4',
      trims: [
        { name: 'Standard', battery_capacity_kwh: 52,   range_km_official: 347, drivetrain: DrivetrainType.RWD },
        { name: 'Pro',      battery_capacity_kwh: 77,   range_km_official: 522, drivetrain: DrivetrainType.RWD },
        { name: 'Pro 4MOTION', battery_capacity_kwh: 77, range_km_official: 480, drivetrain: DrivetrainType.AWD },
      ],
    },
    {
      brandSlug: 'nissan',
      name: 'Leaf',
      name_ar: 'نيسان ليف',
      slug: 'leaf',
      trims: [
        { name: 'S 40 kWh',     battery_capacity_kwh: 40, range_km_official: 270, drivetrain: DrivetrainType.FWD },
        { name: 'Plus 62 kWh',  battery_capacity_kwh: 62, range_km_official: 385, drivetrain: DrivetrainType.FWD },
      ],
    },
    {
      brandSlug: 'chevrolet',
      name: 'Bolt EV',
      name_ar: 'بولت إي في',
      slug: 'bolt-ev',
      trims: [
        { name: 'LT',  battery_capacity_kwh: 65, range_km_official: 416, drivetrain: DrivetrainType.FWD },
        { name: '2LT', battery_capacity_kwh: 65, range_km_official: 416, drivetrain: DrivetrainType.FWD },
      ],
    },
  ];

  let totalModels = 0;
  let totalTrims  = 0;

  for (const mData of modelSeed) {
    const brand = brands.get(mData.brandSlug);
    if (!brand) continue;

    let model = await modelRepo.findOne({ where: { brand_id: brand.id, slug: mData.slug } });
    if (!model) {
      model = modelRepo.create({
        brand_id: brand.id,
        name:     mData.name,
        name_ar:  mData.name_ar,
        slug:     mData.slug,
      });
      await modelRepo.save(model);
      totalModels++;
    }

    for (const tData of mData.trims) {
      const exists = await trimRepo.findOne({ where: { model_id: model.id, name: tData.name } });
      if (!exists) {
        const trim = trimRepo.create({ model_id: model.id, ...tData });
        await trimRepo.save(trim);
        totalTrims++;
      }
    }
  }

  console.log(`  Seeded ${totalModels} car models and ${totalTrims} trims.`);
}

async function seedChargingStations(
  ds: DataSource,
  cities: Map<string, City>,
): Promise<void> {
  const repo = ds.getRepository(ChargingStation);
  const stations = [
    {
      name: 'Tesla Supercharger - Riyadh Park',
      name_ar: 'سوبر تشارجر تسلا - رياض بارك',
      provider: 'Tesla',
      charger_type: ChargerType.SUPERCHARGER,
      power_kw: 250,
      city_slug: 'riyadh',
      is_verified: true,
    },
    {
      name: 'Tesla Supercharger - Mall of Arabia Jeddah',
      name_ar: 'سوبر تشارجر تسلا - مول العرب جدة',
      provider: 'Tesla',
      charger_type: ChargerType.SUPERCHARGER,
      power_kw: 250,
      city_slug: 'jeddah',
      is_verified: true,
    },
    {
      name: 'STC Pay EV Station - Kingdom Centre',
      provider: 'STC Pay EV',
      charger_type: ChargerType.DC_FAST,
      power_kw: 150,
      city_slug: 'riyadh',
      is_verified: true,
    },
    {
      name: 'Zain EV Charging - Dammam Corniche',
      provider: 'Zain EV',
      charger_type: ChargerType.DC_FAST,
      power_kw: 120,
      city_slug: 'dammam',
      is_verified: false,
    },
    {
      name: 'EVIQ Station - Khobar',
      provider: 'EVIQ',
      charger_type: ChargerType.CCS,
      power_kw: 180,
      city_slug: 'khobar',
      is_verified: true,
    },
    {
      name: 'Tesla Supercharger - Taif',
      provider: 'Tesla',
      charger_type: ChargerType.SUPERCHARGER,
      power_kw: 250,
      city_slug: 'taif',
      is_verified: true,
    },
    {
      name: 'Charging Point - Abha Airport',
      provider: null,
      charger_type: ChargerType.AC_LEVEL2,
      power_kw: 22,
      city_slug: 'abha',
      is_verified: false,
    },
    {
      name: 'EVIQ Station - Medina',
      provider: 'EVIQ',
      charger_type: ChargerType.DC_FAST,
      power_kw: 150,
      city_slug: 'medina',
      is_verified: true,
    },
    {
      name: 'Tesla Supercharger - Tabuk',
      provider: 'Tesla',
      charger_type: ChargerType.SUPERCHARGER,
      power_kw: 250,
      city_slug: 'tabuk',
      is_verified: true,
    },
    {
      name: 'DC Fast Charger - Yanbu Industrial',
      provider: 'Saudi Aramco',
      charger_type: ChargerType.DC_FAST,
      power_kw: 50,
      city_slug: 'yanbu',
      is_verified: false,
    },
  ];

  let count = 0;
  for (const s of stations) {
    const city = cities.get(s.city_slug);
    const existing = await repo.findOne({ where: { name: s.name } });
    if (!existing) {
      const station = repo.create({
        name:         s.name,
        name_ar:      (s as any).name_ar ?? null,
        provider:     s.provider ?? null,
        charger_type: s.charger_type,
        power_kw:     s.power_kw,
        city_id:      city?.id ?? null,
        is_verified:  s.is_verified,
      });
      await repo.save(station);
      count++;
    }
  }
  console.log(`  Seeded ${count} charging stations.`);
}

async function seedRoutes(
  ds: DataSource,
  cities: Map<string, City>,
): Promise<void> {
  const repo = ds.getRepository(Route);
  const routePairs: Array<{ from: string; to: string; distance_km: number }> = [
    { from: 'riyadh',  to: 'jeddah',  distance_km: 950 },
    { from: 'riyadh',  to: 'dammam',  distance_km: 400 },
    { from: 'riyadh',  to: 'medina',  distance_km: 870 },
    { from: 'riyadh',  to: 'taif',    distance_km: 780 },
    { from: 'riyadh',  to: 'qassim',  distance_km: 310 },
    { from: 'riyadh',  to: 'hail',    distance_km: 620 },
    { from: 'jeddah',  to: 'mecca',   distance_km: 80  },
    { from: 'jeddah',  to: 'medina',  distance_km: 420 },
    { from: 'jeddah',  to: 'taif',    distance_km: 90  },
    { from: 'jeddah',  to: 'yanbu',   distance_km: 340 },
    { from: 'dammam',  to: 'khobar',  distance_km: 25  },
    { from: 'dammam',  to: 'jubail',  distance_km: 100 },
    { from: 'medina',  to: 'yanbu',   distance_km: 230 },
    { from: 'medina',  to: 'tabuk',   distance_km: 690 },
    { from: 'riyadh',  to: 'najran',  distance_km: 1190 },
    { from: 'riyadh',  to: 'abha',    distance_km: 930 },
    { from: 'jeddah',  to: 'abha',    distance_km: 540 },
    { from: 'tabuk',   to: 'alula',   distance_km: 330 },
    { from: 'medina',  to: 'alula',   distance_km: 500 },
    { from: 'riyadh',  to: 'tabuk',   distance_km: 1440 },
  ];

  let count = 0;
  for (const pair of routePairs) {
    const dep  = cities.get(pair.from);
    const dest = cities.get(pair.to);
    if (!dep || !dest) continue;
    const slug = `${pair.from}-to-${pair.to}`;
    const existing = await repo.findOne({ where: { slug } });
    if (!existing) {
      const route = repo.create({
        departure_city_id:   dep.id,
        destination_city_id: dest.id,
        slug,
        distance_km: pair.distance_km,
      });
      await repo.save(route);
      count++;
    }
  }
  console.log(`  Seeded ${count} routes.`);
}

async function seedUsers(
  ds: DataSource,
  cities: Map<string, City>,
): Promise<Map<string, User>> {
  const repo = ds.getRepository(User);
  const map  = new Map<string, User>();

  // Seed passwords are configurable via env so checked-in defaults are only
  // usable for local development. See apps/api/.env.example for the full list.
  const SUPERADMIN_PWD = process.env.SEED_SUPERADMIN_PWD ?? 'DevSuperAdmin@2026!';
  const ADMIN_PWD      = process.env.SEED_ADMIN_PWD      ?? 'DevAdmin@2026!';
  const MODERATOR_PWD  = process.env.SEED_MODERATOR_PWD  ?? 'DevModerator@2026!';
  const USER_PWD       = process.env.SEED_USER_PWD       ?? 'DevUser@2026!';

  const usersData = [
    {
      key:       'superadmin',
      email:     'superadmin@evtrips.sa',
      username:  'superadmin',
      password:  SUPERADMIN_PWD,
      full_name: 'Super Administrator',
      role:      UserRole.SUPER_ADMIN,
      status:    UserStatus.ACTIVE,
      city_slug: 'riyadh',
    },
    {
      key:       'admin',
      email:     'admin@evtrips.sa',
      username:  'admin_ev',
      password:  ADMIN_PWD,
      full_name: 'Platform Administrator',
      role:      UserRole.ADMIN,
      status:    UserStatus.ACTIVE,
      city_slug: 'riyadh',
    },
    {
      key:       'moderator',
      email:     'moderator@evtrips.sa',
      username:  'mod_hamad',
      password:  MODERATOR_PWD,
      full_name: 'Hamad Al-Moderator',
      role:      UserRole.MODERATOR,
      status:    UserStatus.ACTIVE,
      city_slug: 'jeddah',
    },
    {
      key:       'user1',
      email:     'turki@evtrips.sa',
      username:  'turki_ev',
      password:  USER_PWD,
      full_name: 'Turki Al-Gashami',
      role:      UserRole.USER,
      status:    UserStatus.ACTIVE,
      city_slug: 'riyadh',
      bio:       'EV enthusiast and long-distance traveller across Saudi Arabia.',
      is_contributor_verified: true,
      contributor_points: 850,
    },
    {
      key:       'user2',
      email:     'fahad@evtrips.sa',
      username:  'fahad_ev',
      password:  USER_PWD,
      full_name: 'Fahad Al-Otaibi',
      role:      UserRole.USER,
      status:    UserStatus.ACTIVE,
      city_slug: 'jeddah',
      bio:       'Tesla Model Y owner. Documenting every trip across the Kingdom.',
      is_contributor_verified: true,
      contributor_points: 520,
    },
    {
      key:       'user3',
      email:     'nora@evtrips.sa',
      username:  'nora_drives',
      password:  USER_PWD,
      full_name: 'Nora Al-Zahrani',
      role:      UserRole.USER,
      status:    UserStatus.ACTIVE,
      city_slug: 'dammam',
      bio:       'IONIQ 5 owner. Sustainability advocate.',
      is_contributor_verified: false,
      contributor_points: 120,
    },
    {
      key:       'user4',
      email:     'khaled@evtrips.sa',
      username:  'khaled_ksa_ev',
      password:  USER_PWD,
      full_name: 'Khaled Al-Harbi',
      role:      UserRole.USER,
      status:    UserStatus.ACTIVE,
      city_slug: 'medina',
      bio:       'BYD ATTO 3 owner. Road testing across the western region.',
      contributor_points: 200,
    },
    {
      key:       'user5',
      email:     'sara@evtrips.sa',
      username:  'sara_ioniq',
      password:  USER_PWD,
      full_name: 'Sara Al-Dosari',
      role:      UserRole.USER,
      status:    UserStatus.ACTIVE,
      city_slug: 'khobar',
      contributor_points: 75,
    },
  ];

  for (const u of usersData) {
    let user = await repo.findOne({ where: { email: u.email } });
    if (!user) {
      const city = cities.get(u.city_slug);
      user = repo.create({
        email:                   u.email,
        username:                u.username,
        password_hash:           await hashPassword(u.password),
        full_name:               u.full_name,
        bio:                     (u as any).bio ?? null,
        role:                    u.role,
        status:                  u.status,
        city_id:                 city?.id ?? null,
        email_verified_at:       new Date(),
        is_contributor_verified: (u as any).is_contributor_verified ?? false,
        contributor_points:      (u as any).contributor_points ?? 0,
      });
      await repo.save(user);
    }
    map.set(u.key, user);
  }
  console.log(`  Seeded ${map.size} users.`);
  return map;
}

async function seedBadges(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(Badge);
  const badges = [
    {
      key:             'first_trip',
      name:            'First Trip',
      name_ar:         'أول رحلة',
      description:     'Submitted your very first EV trip.',
      description_ar:  'نشرت أول رحلة كهربائية لك.',
      is_auto_awarded: true,
      criteria:        { trips_count: 1 },
    },
    {
      key:             'road_warrior',
      name:            'Road Warrior',
      name_ar:         'محارب الطريق',
      description:     'Completed 10 published trips.',
      description_ar:  'أكملت 10 رحلات منشورة.',
      is_auto_awarded: true,
      criteria:        { trips_count: 10 },
    },
    {
      key:             'century_club',
      name:            'Century Club',
      name_ar:         'نادي المئة',
      description:     'Completed 100 published trips.',
      description_ar:  'أكملت 100 رحلة منشورة.',
      is_auto_awarded: true,
      criteria:        { trips_count: 100 },
    },
    {
      key:             'long_hauler',
      name:            'Long Hauler',
      name_ar:         'مقطع المسافات',
      description:     'Completed a trip longer than 700 km on a single charge session.',
      description_ar:  'أكملت رحلة أكثر من 700 كم.',
      is_auto_awarded: true,
      criteria:        { distance_km_min: 700 },
    },
    {
      key:             'eco_driver',
      name:            'Eco Driver',
      name_ar:         'سائق اقتصادي',
      description:     'Logged 5 trips with Eco driving style.',
      description_ar:  'سجّلت 5 رحلات بأسلوب القيادة الاقتصادية.',
      is_auto_awarded: true,
      criteria:        { eco_trips: 5 },
    },
    {
      key:             'community_helper',
      name:            'Community Helper',
      name_ar:         'مساعد المجتمع',
      description:     'Received 50 helpful reactions from the community.',
      description_ar:  'حصلت على 50 تقييم "مفيد" من المجتمع.',
      is_auto_awarded: true,
      criteria:        { helpful_reactions: 50 },
    },
    {
      key:             'verified_contributor',
      name:            'Verified Contributor',
      name_ar:         'مساهم موثّق',
      description:     'Officially verified as a trusted trip contributor.',
      description_ar:  'تم التحقق منك رسميًا كمساهم موثوق.',
      is_auto_awarded: false,
      criteria:        null,
    },
    {
      key:             'explorer',
      name:            'Explorer',
      name_ar:         'مستكشف',
      description:     'Covered 5 or more unique routes.',
      description_ar:  'غطّيت 5 مسارات فريدة أو أكثر.',
      is_auto_awarded: true,
      criteria:        { unique_routes: 5 },
    },
    {
      key:             'charging_expert',
      name:            'Charging Expert',
      name_ar:         'خبير الشحن',
      description:     'Logged detailed charging data in 20 trips.',
      description_ar:  'سجّلت بيانات شحن مفصّلة في 20 رحلة.',
      is_auto_awarded: true,
      criteria:        { detailed_charging_trips: 20 },
    },
    {
      key:             'early_adopter',
      name:            'Early Adopter',
      name_ar:         'أول المنضمين',
      description:     'Joined the platform during its first launch month.',
      description_ar:  'انضممت للمنصة خلال الشهر الأول من إطلاقها.',
      is_auto_awarded: false,
      criteria:        null,
    },
  ];

  let count = 0;
  for (const b of badges) {
    const existing = await repo.findOne({ where: { key: b.key } });
    if (!existing) {
      await repo.save(repo.create(b));
      count++;
    }
  }
  console.log(`  Seeded ${count} badges.`);
}

async function seedStaticPages(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(StaticPage);
  const pages = [
    {
      key:      'about',
      title:    'About EV Trips Community',
      title_ar: 'عن منصة رحلات كهربائية',
      content:  'EV Trips Community is the premier platform for electric vehicle owners in Saudi Arabia to share, discover, and learn from real-world road trip experiences across the Kingdom.',
      content_ar: 'منصة رحلات كهربائية هي المنصة الرائدة لأصحاب السيارات الكهربائية في المملكة العربية السعودية لمشاركة تجارب القيادة الحقيقية واكتشافها والتعلم منها.',
      status:   PageStatus.PUBLISHED,
    },
    {
      key:      'faq',
      title:    'Frequently Asked Questions',
      title_ar: 'الأسئلة الشائعة',
      content:  '**Q: How do I submit a trip?**\nA: Sign in, go to your dashboard, click "Add Trip" and fill in the details of your journey.\n\n**Q: Is my data private?**\nA: Your profile visibility can be set to public or private in your account settings.',
      content_ar: '**س: كيف أرسل رحلة؟**\nج: سجّل دخولك، اذهب إلى لوحة التحكم، اضغط على "إضافة رحلة" واملأ تفاصيل رحلتك.',
      status:   PageStatus.PUBLISHED,
    },
    {
      key:      'terms',
      title:    'Terms of Service',
      title_ar: 'شروط الخدمة',
      content:  'By using EV Trips Community, you agree to these terms. You are responsible for the accuracy of the trip data you submit. False or misleading data may result in suspension of your account.',
      content_ar: 'باستخدامك منصة رحلات كهربائية، فإنك توافق على هذه الشروط. أنت مسؤول عن دقة بيانات الرحلة التي تقدمها.',
      status:   PageStatus.PUBLISHED,
    },
    {
      key:      'privacy',
      title:    'Privacy Policy',
      title_ar: 'سياسة الخصوصية',
      content:  'We collect only the data necessary to operate the platform. We do not sell your personal information to third parties. Your trip data is used to improve the community experience.',
      content_ar: 'نجمع فقط البيانات الضرورية لتشغيل المنصة. لا نبيع معلوماتك الشخصية لأطراف ثالثة.',
      status:   PageStatus.PUBLISHED,
    },
    {
      key:      'guidelines',
      title:    'Community Guidelines',
      title_ar: 'إرشادات المجتمع',
      content:  '1. Submit accurate and honest trip data.\n2. Upload clear, relevant photos.\n3. Be respectful in comments.\n4. Do not spam or post duplicate trips.\n5. Report any content that violates these guidelines.',
      content_ar: '1. قدّم بيانات رحلة دقيقة وصادقة.\n2. ارفع صورًا واضحة وذات صلة.\n3. كن محترمًا في التعليقات.\n4. لا تقم بالإرسال المزعج أو نشر رحلات مكررة.',
      status:   PageStatus.PUBLISHED,
    },
    {
      key:      'contact',
      title:    'Contact Us',
      title_ar: 'تواصل معنا',
      content:  'For support, suggestions, or media inquiries, please reach out to us at: support@evtrips.sa',
      content_ar: 'للدعم أو الاقتراحات أو الاستفسارات الإعلامية، يرجى التواصل معنا على: support@evtrips.sa',
      status:   PageStatus.PUBLISHED,
    },
  ];

  let count = 0;
  for (const p of pages) {
    const existing = await repo.findOne({ where: { key: p.key } });
    if (!existing) {
      await repo.save(repo.create(p));
      count++;
    }
  }
  console.log(`  Seeded ${count} static pages.`);
}

async function seedSystemSettings(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(SystemSetting);
  const settings = [
    { key: 'app_name',                 value: 'EV Trips Community',  description: 'Application display name' },
    { key: 'app_name_ar',              value: 'رحلات كهربائية',       description: 'Application display name in Arabic' },
    { key: 'maintenance_mode',         value: 'false',               description: 'Set to true to enable maintenance mode' },
    { key: 'allow_new_registrations',  value: 'true',                description: 'Toggle new user registrations on/off' },
    { key: 'max_trip_media_count',     value: '10',                  description: 'Maximum number of media files per trip' },
    { key: 'max_trip_stops_count',     value: '20',                  description: 'Maximum number of stops per trip' },
    { key: 'featured_trips_count',     value: '6',                   description: 'Number of featured trips shown on homepage' },
    { key: 'min_completeness_to_publish', value: '60',               description: 'Minimum completeness score (%) required to submit a trip for review' },
    { key: 'auto_approve_trips',       value: 'false',               description: 'Auto-approve trips without moderator review' },
    { key: 'email_from_address',       value: 'noreply@evtrips.sa',  description: 'Sender email address for transactional emails' },
    { key: 'email_from_name',          value: 'EV Trips Community',  description: 'Sender name for transactional emails' },
    { key: 'support_email',            value: 'support@evtrips.sa',  description: 'Support contact email' },
    { key: 'default_currency',         value: 'SAR',                 description: 'Default currency for charging costs' },
    { key: 'default_country',          value: 'SA',                  description: 'Default country code' },
    { key: 'points_per_trip',          value: '10',                  description: 'Contributor points awarded per approved trip' },
    { key: 'points_per_helpful_vote',  value: '2',                   description: 'Contributor points per helpful reaction received' },
  ];

  let count = 0;
  for (const s of settings) {
    const existing = await repo.findOne({ where: { key: s.key } });
    if (!existing) {
      await repo.save(repo.create(s));
      count++;
    }
  }
  console.log(`  Seeded ${count} system settings.`);
}

// ---------------------------------------------------------------------------
// Main Runner
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  // Safety guard: refuse to seed against a production database by accident.
  // To intentionally seed production, set ALLOW_PROD_SEED=yes-i-mean-it.
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_PROD_SEED !== 'yes-i-mean-it'
  ) {
    console.error(
      '[seed] Refusing to run: NODE_ENV=production and ALLOW_PROD_SEED is ' +
        'not set to "yes-i-mean-it". Aborting.',
    );
    process.exit(1);
  }

  console.log('Connecting to database...');
  await AppDataSource.initialize();
  console.log('Connected. Running seeds...\n');

  try {
    console.log('Seeding cities...');
    const cities = await seedCities(AppDataSource);

    console.log('Seeding car brands...');
    const brands = await seedCarBrands(AppDataSource);

    console.log('Seeding car models and trims...');
    await seedCarModelsAndTrims(AppDataSource, brands);

    console.log('Seeding charging stations...');
    await seedChargingStations(AppDataSource, cities);

    console.log('Seeding routes...');
    await seedRoutes(AppDataSource, cities);

    console.log('Seeding users...');
    await seedUsers(AppDataSource, cities);

    console.log('Seeding badges...');
    await seedBadges(AppDataSource);

    console.log('Seeding static pages...');
    await seedStaticPages(AppDataSource);

    console.log('Seeding system settings...');
    await seedSystemSettings(AppDataSource);

    console.log('\nAll seeds completed successfully.');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

main();
