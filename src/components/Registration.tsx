import React, { useState } from 'react';
import * as faceapi from 'face-api.js';
import WebcamCapture from './WebcamCapture';
import { User } from '../types';

interface RegistrationProps {
  onRegister: (user: User) => void;
  checkNameExists: (name: string) => boolean;
}

const Registration: React.FC<RegistrationProps> = ({ onRegister, checkNameExists }) => {
  const [name, setName] = useState('');
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const handleNameSubmit = () => {
    if (checkNameExists(name)) {
      setNameError('この名前はすでに登録されています');
      return;
    }
    setNameError(null);
    setStep(2);
  };

  const handleCapture = async (imageSrc: string) => {
    setProcessing(true);
    try {
      const img = await faceapi.fetchImage(imageSrc);
      const detections = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detections) {
        const user = {
          name,
          descriptor: detections.descriptor
        };
        console.log(user);
        onRegister(user);
        localStorage.setItem('registeredUser', JSON.stringify(user));
        setStep(3);
      } else {
        alert('顔を検出できませんでした。もう一度お試しください。');
      }
    } catch (error) {
      console.error('Error during face detection:', error);
      alert('エラーが発生しました。もう一度お試しください。');
    }
    setProcessing(false);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">顔認証登録</h2>
      
      {step === 1 && (
        <div>
          <p className="mb-4">名前を入力してください</p>
          <div className="space-y-2">
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError(null);
              }}
              className={`w-full p-2 border rounded-lg ${
                nameError ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="名前を入力"
            />
            {nameError && (
              <p className="text-red-500 text-sm">{nameError}</p>
            )}
          </div>
          <button
            onClick={handleNameSubmit}
            disabled={!name}
            className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            次へ
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <p className="mb-4">カメラに顔を向けて、写真を撮影してください</p>
          <WebcamCapture onCapture={handleCapture} />
          {processing && (
            <div className="mt-4 text-center text-gray-600">
              処理中...
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="text-center">
          <p className="text-green-600 font-bold mb-4">登録が完了しました！</p>
          <p>認証画面で顔認証を試してみましょう。</p>
        </div>
      )}
    </div>
  );
};

export default Registration;