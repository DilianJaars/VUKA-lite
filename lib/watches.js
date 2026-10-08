// Every SA budget brand VUKA supports. `app` is the brand's native companion app.
export const WATCHES = [
  { id: 'polaroid', name: 'Polaroid Pulse GPS', short: 'Polaroid Pulse', models: 'Pulse GPS', app: 'Da Fit', color: '#FF5A1F', ink: '#FFFFFF', mark: 'PP', gps: 'True GPS', accuracy: 92, budget: true },
  { id: 'amazfit', name: 'Amazfit', short: 'Amazfit', models: 'Active 2 / Bip 6 / T-Rex 3', app: 'Zepp', color: '#F5C400', ink: '#000000', mark: 'AZ', gps: 'True GPS', accuracy: 96, budget: false },
  { id: 'huawei', name: 'Huawei', short: 'Huawei', models: 'Watch Fit 3 / GT 4 / Band 9', app: 'Huawei Health', color: '#E60012', ink: '#FFFFFF', mark: 'HW', gps: 'True GPS', accuracy: 95, budget: false },
  { id: 'xiaomi', name: 'Xiaomi Redmi Watch 5 Active', short: 'Redmi Watch', models: 'Redmi Watch 5 Active', app: 'Mi Fitness', color: '#FF6900', ink: '#FFFFFF', mark: 'MI', gps: 'Phone-assisted GPS', accuracy: 90, budget: true },
  { id: 'honor', name: 'Honor Watch 5', short: 'Honor', models: 'Watch 5', app: 'Honor Health', color: '#00B4FF', ink: '#000000', mark: 'HO', gps: 'Phone-assisted GPS', accuracy: 91, budget: false },
  { id: 'volkano', name: 'Volkano', short: 'Volkano', models: 'Volkano smartwatches', app: 'FitPro', color: '#7C3AED', ink: '#FFFFFF', mark: 'VK', gps: 'Phone-assisted GPS', accuracy: 78, budget: true },
  { id: 'lava', name: 'Lava / Ultra-Link', short: 'Lava', models: 'Lava / Ultra-Link', app: 'GloryFit', color: '#2DD4BF', ink: '#000000', mark: 'LV', gps: 'Phone-assisted GPS', accuracy: 74, budget: true },
  { id: 'mibro', name: 'Mibro', short: 'Mibro', models: 'Mibro watches', app: 'Mibro Fit', color: '#3B82F6', ink: '#FFFFFF', mark: 'MB', gps: 'Phone-assisted GPS', accuracy: 85, budget: true },
  { id: 'haylou', name: 'Haylou', short: 'Haylou', models: 'Haylou watches', app: 'Haylou Fun', color: '#10B981', ink: '#000000', mark: 'HY', gps: 'Phone-assisted GPS', accuracy: 83, budget: true },
  { id: 'oraimo', name: 'Oraimo', short: 'Oraimo', models: 'Oraimo watches', app: 'Oraimo Health', color: '#F97316', ink: '#000000', mark: 'OR', gps: 'Phone-assisted GPS', accuracy: 80, budget: true },
  { id: 'kieslect', name: 'Kieslect', short: 'Kieslect', models: 'Kieslect watches', app: 'Kieslect Fit', color: '#EC4899', ink: '#FFFFFF', mark: 'KS', gps: 'True GPS', accuracy: 86, budget: true },
  { id: 'garmin', name: 'Garmin', short: 'Garmin', models: 'Forerunner / Venu / Instinct', app: 'Garmin Connect', color: '#0EA5E9', ink: '#000000', mark: 'GM', gps: 'True GPS', accuracy: 98, budget: false },
  { id: 'samsung', name: 'Samsung', short: 'Samsung', models: 'Galaxy Watch / Fit', app: 'Samsung Health', color: '#1D4ED8', ink: '#FFFFFF', mark: 'SM', gps: 'True GPS', accuracy: 94, budget: false },
  { id: 'generic', name: 'Any watch - GPX / TCX / FIT', short: 'File upload', models: 'Any brand', app: 'GPX / TCX / FIT file', color: '#C6FF00', ink: '#000000', mark: 'GX', gps: 'File import', accuracy: 88, budget: false, kind: 'file' },
  { id: 'strava', name: 'Strava import', short: 'Strava', models: 'Your Strava runs', app: 'Strava', color: '#FC4C02', ink: '#FFFFFF', mark: 'ST', gps: 'Strava import', accuracy: 90, budget: false, kind: 'strava' },
];

export const WATCH_BRANDS = WATCHES.filter((w) => !w.kind); // real watch brands (onboarding picker)
const byId = Object.fromEntries(WATCHES.map((w) => [w.id, w]));
export const getWatch = (id) => byId[id] || byId.generic;

export const CITIES = [
  { id: 'Cape Town', label: 'Cape Town', center: [-33.9249, 18.4241] },
  { id: 'Joburg', label: 'Jozi', center: [-26.2041, 28.0473] },
  { id: 'Durban', label: 'Durban', center: [-29.8587, 31.0218] },
  { id: 'Other', label: 'Other', center: [-33.9249, 18.4241] },
];
export const cityCenter = (c) => (CITIES.find((x) => x.id === c) || CITIES[0]).center;
export const cityLabel = (c) => (CITIES.find((x) => x.id === c) || CITIES[0]).label;
