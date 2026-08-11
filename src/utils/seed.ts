import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/db';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Cart } from '../models/Cart';
import { Wishlist } from '../models/Wishlist';
import { Order } from '../models/Order';
import mongoose from 'mongoose';

const img = (seed: string) =>
  `https://picsum.photos/seed/${seed}/600/600`;

const products = [
  // ── Audio ──
  { name: 'Aurora Wireless Headphones', description: 'Immersive over-ear headphones with active noise cancellation and 40-hour battery life.', price: 249.99, category: 'Audio', brand: 'Aurora', stock: 34, featured: true, images: [img('headphones1'), img('headphones2')] },
  { name: 'Pulse Wireless Earbuds', description: 'Compact true-wireless earbuds with spatial audio and a pocket-sized charging case.', price: 99.99, category: 'Audio', brand: 'Pulse', stock: 75, featured: true, images: [img('earbuds1'), img('earbuds2')] },
  { name: 'Echo Bluetooth Speaker', description: 'Waterproof 360° Bluetooth speaker with deep bass and 24-hour playback.', price: 119.0, category: 'Audio', brand: 'Echo', stock: 3, featured: true, images: [img('speaker1'), img('speaker2')] },
  { name: 'Resonance Studio Headphones', description: 'Open-back studio headphones with 50mm drivers and a braided detachable cable.', price: 179.0, category: 'Audio', brand: 'Resonance', stock: 18, featured: false, images: [img('studiohead1')] },
  { name: 'Bass Pro Soundbar', description: 'Slim 3.1ch soundbar with Dolby Atmos and a wireless subwoofer for room-filling sound.', price: 299.0, category: 'Audio', brand: 'Bass Pro', stock: 22, featured: false, images: [img('soundbar1')] },

  // ── Peripherals ──
  { name: 'Nimbus Mechanical Keyboard', description: 'Hot-swappable mechanical keyboard with per-key RGB and gasket-mounted plate.', price: 159.0, category: 'Peripherals', brand: 'Nimbus', stock: 52, featured: true, images: [img('keyboard1'), img('keyboard2')] },
  { name: 'Vela 4K Webcam', description: 'Ultra-sharp 4K webcam with AI auto-framing and dual noise-cancelling mics.', price: 129.5, category: 'Peripherals', brand: 'Vela', stock: 21, featured: false, images: [img('webcam1')] },
  { name: 'Drift Ergonomic Mouse', description: 'Vertical ergonomic mouse with silent clicks, six DPI levels and a braided cable.', price: 59.99, category: 'Peripherals', brand: 'Drift', stock: 4, featured: false, images: [img('mouse1')] },
  { name: 'Glide Wireless Mouse', description: 'Ultra-lightweight wireless gaming mouse with 26K DPI sensor and 70-hour battery.', price: 79.99, category: 'Peripherals', brand: 'Glide', stock: 31, featured: false, images: [img('wlmouse1')] },
  { name: 'Slate Compact Keyboard', description: 'Low-profile 65% wireless keyboard with scissor switches and three-device pairing.', price: 109.0, category: 'Peripherals', brand: 'Slate', stock: 47, featured: false, images: [img('compkbd1')] },
  { name: 'Precision Drawing Tablet', description: '10-inch pen tablet with 8192 pressure levels and tilt support for digital artists.', price: 139.0, category: 'Peripherals', brand: 'Precision', stock: 14, featured: true, images: [img('tablet1')] },

  // ── Displays ──
  { name: 'Cobalt 27" 4K Monitor', description: 'Factory-calibrated 27-inch 4K IPS monitor with 99% sRGB and USB-C 90W.', price: 449.0, category: 'Displays', brand: 'Cobalt', stock: 15, featured: true, images: [img('monitor1')] },
  { name: 'Vivid 32" Curved QHD', description: '32-inch 1440p VA curved display with 165Hz refresh rate and 1ms MPRT.', price: 389.0, category: 'Displays', brand: 'Vivid', stock: 9, featured: true, images: [img('monitor2')] },
  { name: 'Pixel 24" IPS FHD', description: 'Budget-friendly 24-inch 1080p IPS panel with 75Hz, VESA mount and eye-care mode.', price: 179.0, category: 'Displays', brand: 'Pixel', stock: 38, featured: false, images: [img('monitor3')] },
  { name: 'Ultraview 49" Super UltraWide', description: '49-inch 5120×1440 DQHD curved display ideal for multi-window productivity setups.', price: 1099.0, category: 'Displays', brand: 'Ultraview', stock: 6, featured: false, images: [img('ultrawide1')] },

  // ── Storage ──
  { name: 'Terra Portable SSD 2TB', description: 'Pocket 2TB NVMe SSD with 1050 MB/s reads and a rugged aluminium shell.', price: 189.0, category: 'Storage', brand: 'Terra', stock: 28, featured: false, images: [img('ssd1')] },
  { name: 'Vault NAS Drive 8TB', description: '8TB desktop hard drive optimised for NAS enclosures with CMR recording.', price: 219.0, category: 'Storage', brand: 'Vault', stock: 12, featured: false, images: [img('nas1')] },
  { name: 'Flash USB-C Drive 256GB', description: 'Dual USB-C/A flash drive with 400 MB/s transfers and a keyring loop.', price: 39.99, category: 'Storage', brand: 'Flash', stock: 120, featured: false, images: [img('usb1')] },
  { name: 'CoreSSD M.2 1TB', description: 'Gen 4 M.2 NVMe SSD with 7000 MB/s sequential read and an integrated heatspreader.', price: 129.0, category: 'Storage', brand: 'CoreSSD', stock: 33, featured: false, images: [img('m2ssd1')] },

  // ── Wearables ──
  { name: 'Orbit Smartwatch Series 5', description: 'AMOLED smartwatch with ECG, SpO2, GPS and 7-day battery.', price: 329.99, category: 'Wearables', brand: 'Orbit', stock: 40, featured: true, images: [img('watch1'), img('watch2')] },
  { name: 'Band Fit Tracker Pro', description: 'Slim fitness tracker with 24/7 heart rate, sleep scoring and 14-day battery.', price: 79.99, category: 'Wearables', brand: 'Band Fit', stock: 55, featured: false, images: [img('fitband1')] },
  { name: 'Lens AR Glasses', description: 'Lightweight AR glasses with heads-up navigation, call display and UV400 lenses.', price: 499.0, category: 'Wearables', brand: 'Lens', stock: 7, featured: true, images: [img('arglasses1')] },

  // ── Home ──
  { name: 'Lumen Desk Lamp', description: 'Aluminium LED desk lamp with adjustable color temperature and a wireless charging base.', price: 89.0, category: 'Home', brand: 'Lumen', stock: 60, featured: false, images: [img('lamp1')] },
  { name: 'Halo Ring Light', description: '18-inch bi-color ring light with wireless remote and sturdy tripod stand.', price: 74.5, category: 'Home', brand: 'Halo', stock: 45, featured: false, images: [img('ringlight1')] },
  { name: 'Air Smart Purifier', description: 'HEPA H13 air purifier covering 600 sq ft with a real-time AQI display and auto mode.', price: 219.0, category: 'Home', brand: 'Air', stock: 19, featured: false, images: [img('purifier1')] },
  { name: 'Chill Mini Fridge', description: '10L compact thermoelectric fridge perfect for a desk or bedside — whisper-quiet operation.', price: 69.0, category: 'Home', brand: 'Chill', stock: 27, featured: false, images: [img('minifridge1')] },

  // ── Accessories ──
  { name: 'Nova USB-C Hub', description: '9-in-1 USB-C hub with HDMI 4K60, Ethernet, SD card slot and 100W passthrough.', price: 69.99, category: 'Accessories', brand: 'Nova', stock: 90, featured: false, images: [img('hub1')] },
  { name: 'Wrap Laptop Sleeve 15"', description: 'Water-repellent neoprene sleeve for 15-inch laptops with accessory pocket and handle.', price: 34.99, category: 'Accessories', brand: 'Wrap', stock: 68, featured: false, images: [img('sleeve1')] },
  { name: 'ChargePad 3-in-1 Wireless', description: 'Simultaneous wireless charging for phone, watch and earbuds on a single pad.', price: 49.99, category: 'Accessories', brand: 'ChargePad', stock: 44, featured: true, images: [img('chargepad1')] },
  { name: 'CablePro Braided USB-C 2m', description: '100W braided USB-C cable with E-Marker chip rated for 2m and 10 Gbps data.', price: 19.99, category: 'Accessories', brand: 'CablePro', stock: 200, featured: false, images: [img('cable1')] },

  // ── Gaming ──
  { name: 'Frag Pro Gaming Headset', description: '7.1 surround-sound gaming headset with a retractable boom mic and RGB earcups.', price: 89.99, category: 'Gaming', brand: 'Frag', stock: 36, featured: true, images: [img('gamingheadset1')] },
  { name: 'Apex Gaming Chair', description: 'Ergonomic gaming chair with lumbar cushion, 4D armrests and 165° recline.', price: 349.0, category: 'Gaming', brand: 'Apex', stock: 11, featured: true, images: [img('gamingchair1')] },
  { name: 'Strike RGB Mousepad XL', description: 'Extended desk mat (900×400mm) with a smooth micro-textured surface and anti-slip base.', price: 39.99, category: 'Gaming', brand: 'Strike', stock: 82, featured: false, images: [img('mousepad1')] },
  { name: 'Rumble Pro Controller', description: 'Wireless game controller with hall-effect sticks, trigger stops and 20-hour battery.', price: 69.99, category: 'Gaming', brand: 'Rumble', stock: 29, featured: false, images: [img('controller1')] },
  { name: 'Vision 240Hz Gaming Monitor', description: '24-inch 1080p IPS with 240Hz, 0.5ms GtG response and G-Sync compatible display.', price: 319.0, category: 'Gaming', brand: 'Vision', stock: 17, featured: false, images: [img('gamingmonitor1')] },
];

const run = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Cart.deleteMany({}),
    Wishlist.deleteMany({}),
    Order.deleteMany({}),
  ]);

  const admin = await User.create({
    name: 'Admin',
    email: 'admin@catalog.com',
    password: 'admin123',
    role: 'admin',
  });

  const user = await User.create({
    name: 'Demo User',
    email: 'user@catalog.com',
    password: 'user123',
    role: 'user',
  });

  await Product.insertMany(products);

  console.log('Seed complete.');
  console.log('Admin login: admin@catalog.com / admin123');
  console.log('User login:  user@catalog.com / user123');
  console.log(`Seeded ${products.length} products, users: ${admin.email}, ${user.email}`);

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
