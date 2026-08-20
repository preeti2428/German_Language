import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'lingo-reels', // The folder in cloudinary where reels will be saved
    resource_type: 'video', // Important for video uploads
    allowed_formats: ['mp4', 'mov', 'avi', 'mkv'],
  } as any,
});

export const upload = multer({ storage: storage });
export default cloudinary;
