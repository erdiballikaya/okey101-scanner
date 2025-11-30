// app/roboflow.ts
import axios from 'axios';

const ROBOFLOW_ENDPOINT = 'https://serverless.roboflow.com/okey/5';
const ROBOFLOW_API_KEY = '99g8CwQWUHzc8ivhxIJF'; // PoC için direkt yazdık

export type RoboflowPrediction = {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
  class_id: number;
  detection_id: string;
};

export async function analyzeImageWithRoboflow(base64Image: string) {
  // Eğer "data:image/jpeg;base64,...." şeklinde gelirse prefix'i temizleyelim:
  const cleaned = base64Image.replace(/^data:image\/\w+;base64,/, '');

  const response = await axios({
    method: 'POST',
    url: ROBOFLOW_ENDPOINT,
    params: {
      api_key: ROBOFLOW_API_KEY,
    },
    data: cleaned,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return response.data as {
    predictions: RoboflowPrediction[];
    [key: string]: any;
  };
}
