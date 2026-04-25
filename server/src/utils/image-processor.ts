import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function optimizeImage(buffer: Buffer, _filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'aura-products',
        transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result!.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
}

export async function optimizeFromUrl(url: string): Promise<string> {
  try {
    // If it's already a cloudinary URL, don't re-upload
    if (url.includes('cloudinary.com')) return url;

    // Use Cloudinary's upload from URL feature
    const result = await cloudinary.uploader.upload(url, {
      folder: 'aura-products',
      transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
    });
    
    return result.secure_url;
  } catch (error) {
    console.error(`Failed to upload image to Cloudinary from URL: ${url}`, error);
    return url; // Fallback to original URL if upload fails
  }
}
