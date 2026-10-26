import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dev-api-bengkelmouse.duaenam.id/api';
const SETTINGS_FILE_PATH = path.join(process.cwd(), 'data', 'settings.json');

const DEFAULT_SETTINGS = {
  name: 'Bengkel Mouse',
  phone: '083811691729',
  whatsapp: '6283811691729',
  whatsappDisplay: '+62 838-1169-1729',
  address: 'Jl. H. Hasan No.26, RT.3/RW.10, Baru, Kec. Pasar Rebo, Jakarta Timur 13780',
  receiverName: 'Bengkel Mouse',
  brands: [
    'Logitech',
    'Razer',
    'Zowie',
    'Pulsar',
    'SteelSeries',
    'Endgame Gear',
    'Lamzu',
    'Vaxee',
    'Fantech',
    'Rexus',
    'VortexSeries',
    'Lainnya',
  ],
  brandModels: {
    Logitech: ['G Pro X Superlight 2', 'G Pro X Superlight', 'G304', 'G502 X', 'G Pro Wireless', 'G703 Hero'],
    Razer: ['Viper V3 Pro', 'DeathAdder V3 Pro', 'Viper V2 Pro', 'Viper Mini', 'Basilisk V3', 'Cobra Pro'],
    Zowie: ['EC2-CW', 'EC1-CW', 'EC3-CW', 'FK2-C', 'ZA13-C', 'U2 Wireless'],
    Pulsar: ['X2V2', 'X2 Mini', 'Xlite V3', 'X2H', 'X2A'],
    SteelSeries: ['Aerox 3 Wireless', 'Aerox 5', 'Prime Wireless', 'Rival 3'],
    'Endgame Gear': ['OP1we', 'OP1 8k', 'XM2we', 'XM1r'],
    Lamzu: ['Atlantis OG V2', 'Atlantis Mini', 'Maya 4K', 'Thorn', 'Paro'],
    Vaxee: ['NP-01S Wireless', 'XE Wireless', 'Outset AX Wireless'],
    Fantech: ['Helios II Pro', 'Aria XD7', 'Thor II'],
    Rexus: ['Dagger FX1', 'Daxa Air III', 'Daxa Air IV', 'Gladius'],
    VortexSeries: ['Ino Pro', 'GT-8', 'Oni R1', 'Zircon X'],
    Lainnya: ['Darmoshark M3', 'Zaopin Z1 Pro', 'Attack Shark X3', 'Scyrox V8'],
  },
};

function readLocalSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (err) {
    console.warn('Failed to read settings file:', err);
  }
  return DEFAULT_SETTINGS;
}

function writeLocalSettings(data: unknown) {
  try {
    const dir = path.dirname(SETTINGS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to write settings file:', err);
  }
}

export async function GET() {
  const settings = readLocalSettings();

  // Try to sync store info with backend
  try {
    const backendRes = await fetch(`${BASE_URL}/store`, { cache: 'no-store' });
    if (backendRes.ok) {
      const storeData = await backendRes.json();
      if (storeData) {
        if (storeData.name) settings.name = storeData.name;
        if (storeData.phone) settings.phone = storeData.phone;
        if (storeData.whatsapp) {
          settings.whatsapp = storeData.whatsapp;
          if (!settings.whatsappDisplay || settings.whatsappDisplay === DEFAULT_SETTINGS.whatsappDisplay) {
            settings.whatsappDisplay = storeData.whatsapp.startsWith('62')
              ? `+${storeData.whatsapp.slice(0, 2)} ${storeData.whatsapp.slice(2, 5)}-${storeData.whatsapp.slice(5, 9)}-${storeData.whatsapp.slice(9)}`
              : storeData.whatsapp;
          }
        }
        if (storeData.address) settings.address = storeData.address;
        if (storeData.receiverName) settings.receiverName = storeData.receiverName;
      }
    }
  } catch {
    // ignore backend error, use local settings
  }

  return NextResponse.json(settings);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const current = readLocalSettings();

    const updated = {
      ...current,
      ...body,
      brands: body.brands || current.brands,
      brandModels: body.brandModels || current.brandModels,
    };

    // Save locally
    writeLocalSettings(updated);

    // Try to sync with backend store API if token provided
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      try {
        await fetch(`${BASE_URL}/store`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify({
            name: updated.name,
            address: updated.address,
            phone: updated.phone,
            whatsapp: updated.whatsapp,
            receiverName: updated.receiverName,
          }),
        });
      } catch (err) {
        console.warn('Backend store update sync failed:', err);
      }
    }

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan pengaturan';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
