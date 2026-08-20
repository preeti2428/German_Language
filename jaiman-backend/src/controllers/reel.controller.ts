import { Request, Response } from 'express';
import Reel from '../models/Reel';

// Extend Express Request to include the file object provided by multer-storage-cloudinary
interface CloudinaryFile extends Express.Multer.File {
  path: string; // The URL returned by cloudinary
}

export const uploadReel = async (req: Request, res: Response) => {
  try {
    const file = req.file as CloudinaryFile;
    if (!file) {
      return res.status(400).json({ message: 'No video file provided' });
    }

    const { title, description, language, level, tags } = req.body;

    const newReel = new Reel({
      creator: req.user?.id, // Assuming authMiddleware sets req.user
      videoUrl: file.path, // This is the Cloudinary URL
      title: title || 'Untitled Reel',
      description: description || '',
      language: language || 'German',
      level: level || 'A1',
      tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
      duration: 15, // Mock duration or extract later
      likes: 0,
      views: 0
    });

    await newReel.save();
    res.status(201).json({ message: 'Reel uploaded successfully', reel: newReel });
  } catch (error) {
    console.error('Error uploading reel:', error);
    res.status(500).json({ message: 'Server error uploading reel' });
  }
};

export const getReels = async (req: Request, res: Response) => {
  try {
    // Fetch reels, optionally populate creator details
    const reels = await Reel.find().populate('creator', 'name email').sort({ createdAt: -1 });
    res.status(200).json(reels);
  } catch (error) {
    console.error('Error fetching reels:', error);
    res.status(500).json({ message: 'Server error fetching reels' });
  }
};
