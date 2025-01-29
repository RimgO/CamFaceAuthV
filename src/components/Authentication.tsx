import React, { useState } from 'react';
import * as faceapi from 'face-api.js';
import WebcamCapture from './WebcamCapture';
import { User } from '../types';

interface AuthenticationProps {
  users: User[];
}

const Authentication: React.FC<AuthenticationProps> = ({ users }) => {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; name?: string } | null>(null);

  const handleCapture = async (imageSrc: string) => {
    setProcessing(true);
    setResult(null);

    try {
      const img = await faceapi.fetchImage(imageSrc);
      const detection = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        const faceMatcher = new faceapi.FaceMatcher(
          users.map(user => ({
            descriptor: user.descriptor,
            label: user.name
          }))
        );

        const match = faceMatcher.findBestMatch(detection.descriptor);

        if (match.distance < 0.6) {
          setResult({ success: true, name: match.label });
        } else {
          setResult({ success: false });
        }
      } else {
        alert('顔を検出できませんでした。もう一度お試しください。');
      }
    } catch (error) {
      console.error('Error during authentication:', error);
      alert('エラーが発生しました。もう一度お試しください。');
    }

    setProcessing(false);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">顔認証</h2>
      
      <p className="mb-4">カメラに顔を向けて、認証を行ってください</p>
      <WebcamCapture onCapture={handleCapture} />
      
      {processing && (
        <div className="mt-4 text-center text-gray-600">
          認証中...
        </div>
      )}

      {result && (
        <div className="mt-4 text-center">
          {result.success ? (
            <div className="text-green-600">
              <p className="font-bold">認証成功！</p>
              <p>ようこそ、{result.name}さん</p>
            </div>
          ) : (
            <div className="text-red-600">
              <p className="font-bold">認証失敗</p>
              <p>登録されているユーザーと一致しません</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Authentication;