import { Injectable } from '@nestjs/common';
import ImageKit from 'imagekit';
import { Express } from 'express';

@Injectable()
export class FileUploadService {
  private imagekit: ImageKit;

  constructor() {
    this.imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
    });
  }

  async uploadImage(file: Express.Multer.File ,folder?: string, quality?: number): Promise<string> {
    try {
      const fileType = file.mimetype.split('/')[1].toLowerCase();
      let processedBuffer: Buffer;

        processedBuffer = file.buffer;

      const uploadResponse = await this.imagekit.upload({
        file: processedBuffer,
        fileName: `${Date.now()}.${fileType}`,
        folder: folder || '/trip-mate',
      });

      return uploadResponse.filePath;
    } catch (error) {
      console.error('ImageKit upload error:', error);
      throw error;
    }
  }

  async uploadImages(images: string[]): Promise<string[]> {
    const uploadPromises = images.map(async (imageUrl) => {
      const response = await fetch(imageUrl);
      const buffer = Buffer.from(await response.arrayBuffer());

      const uploadResponse = await this.imagekit.upload({
        file: buffer,
        fileName: `${Date.now()}.jpg`,
        folder: '/trip-mate',
      });

      return uploadResponse.url;
    });

    return Promise.all(uploadPromises);
  }

  async uploadBuffer(buffer: Buffer): Promise<string> {
    try {
      const uploadResponse = await this.imagekit.upload({
        file: buffer,
        fileName: `${Date.now()}.jpg`,
        folder: '/trip-mate',
      });

      return uploadResponse.url;
    } catch (error) {
      console.error('ImageKit uploadBuffer error:', error);
      throw error;
    }
  }
}
