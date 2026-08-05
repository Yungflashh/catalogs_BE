import { v2 as cloudinary } from 'cloudinary';

const name = process.env.CLOUDINARY_CLOUD_NAME;
const key  = process.env.CLOUDINARY_API_KEY;
const sec  = process.env.CLOUDINARY_API_SECRET;

if (!name || !key || !sec) {
  console.warn(
    '[cloudinary] CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET not set — image uploads will fail'
  );
}

cloudinary.config({
  cloud_name: name,
  api_key:    key,
  api_secret: sec,
  secure:     true,
});

export default cloudinary;
