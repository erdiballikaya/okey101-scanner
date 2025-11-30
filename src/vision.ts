// src/vision.ts
import axios from 'axios';

const VISION_API_KEY = 'AIzaSyD6bt0HCNYHQW_bXfVk-EMookFZbbRN-hY';
const VISION_URL = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`;

export type VisionBox = {
  id: string;
  text: string;   // "1", "10", "13" vs.
  value: number;  // sayıya çevrilmiş hali
  x: number;
  y: number;
  width: number;
  height: number;
};

export async function analyzeImageWithVision(base64Image: string): Promise<VisionBox[]> {
  const cleaned = base64Image.replace(/^data:image\/\w+;base64,/, '');

  const body = {
    requests: [
      {
        image: { content: cleaned },
        features: [{ type: 'TEXT_DETECTION' }],
      },
    ],
  };

  try {
    const response = await axios.post(VISION_URL, body);
    const data = response.data;

    const ann = data.responses?.[0];
    if (!ann || !ann.textAnnotations || ann.textAnnotations.length === 0) {
      return [];
    }

    const words = ann.textAnnotations.slice(1);
    const boxes: VisionBox[] = [];

    for (const w of words) {
      const text: string = w.description ?? '';
      if (!/^\d+$/.test(text)) continue;

      const value = parseInt(text, 10);
      if (value < 1 || value > 13) continue;

      const vertices = w.boundingPoly?.vertices ?? [];
      if (vertices.length === 0) continue;

      const xs = vertices.map((v: any) => v.x ?? 0);
      const ys = vertices.map((v: any) => v.y ?? 0);

      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      const width = maxX - minX;
      const height = maxY - minY;
      const x = minX + width / 2;
      const y = minY + height / 2;

      boxes.push({
        id: `${text}-${minX}-${minY}-${Math.random()}`,
        text,
        value,
        x,
        y,
        width,
        height,
      });
    }

    boxes.sort((a, b) => a.x - b.x);
    return boxes;
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      console.log('Vision error status:', err.response?.status);
      console.log('Vision error data:', JSON.stringify(err.response?.data, null, 2));
    } else {
      console.log('Vision unknown error:', err);
    }
    return [];
  }
}
