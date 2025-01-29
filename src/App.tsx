import React, { useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { Scan, UserPlus } from 'lucide-react';
import Registration from './components/Registration';
import Authentication from './components/Authentication';
import { User } from './types';

// ローカルストレージのキー
const USERS_STORAGE_KEY = 'face-auth-users';

// Float32Array をシリアライズ可能な形式に変換
const serializeDescriptor = (descriptor: Float32Array): number[] => {
  return Array.from(descriptor);
};

// シリアライズされた配列を Float32Array に戻す
const deserializeDescriptor = (array: number[]): Float32Array => {
  return new Float32Array(array);
};

function App() {
  const [mode, setMode] = useState<'register' | 'authenticate'>('register');
  const [users, setUsers] = useState<User[]>(() => {
    // 初期化時にローカルストレージからデータを読み込む
    const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (savedUsers) {
      try {
        const parsedUsers = JSON.parse(savedUsers);
        // デシリアライズ
        return parsedUsers.map((user: any) => ({
          ...user,
          descriptor: deserializeDescriptor(user.descriptor)
        }));
      } catch (error) {
        console.error('Failed to load users from localStorage:', error);
        return [];
      }
    }
    return [];
  });
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // ユーザーデータが変更されたらローカルストレージに保存
  useEffect(() => {
    try {
      // シリアライズ
      const serializedUsers = users.map(user => ({
        ...user,
        descriptor: serializeDescriptor(user.descriptor)
      }));
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(serializedUsers));
    } catch (error) {
      console.error('Failed to save users to localStorage:', error);
    }
  }, [users]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
        
        console.log('Starting model loading...');
        
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
          .then(() => console.log('SSD Mobilenet model loaded'))
          .catch(error => {
            throw new Error(`Failed to load face detection model: ${error.message}`);
          });

        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
          .then(() => console.log('Face landmark model loaded'))
          .catch(error => {
            throw new Error(`Failed to load face landmark model: ${error.message}`);
          });

        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
          .then(() => console.log('Face recognition model loaded'))
          .catch(error => {
            throw new Error(`Failed to load face recognition model: ${error.message}`);
          });
        
        console.log('All models loaded successfully');
        setModelsLoaded(true);
        setLoadingError(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error loading models:', errorMessage);
        setLoadingError(errorMessage);
        alert('モデルの読み込みに失敗しました。ページを更新してください。\n\n詳細: ' + errorMessage);
      }
    };

    loadModels();
  }, []);

  const handleRegister = (user: User) => {
    setUsers([...users, user]);
  };

  if (!modelsLoaded) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl">モデルを読み込んでいます...</p>
          <p className="text-sm text-gray-600 mt-2">しばらくお待ちください</p>
          {loadingError && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
              <p className="font-semibold">エラーが発生しました:</p>
              <p className="mt-1">{loadingError}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-center mb-8 space-x-4">
          <button
            onClick={() => setMode('register')}
            className={`flex items-center px-6 py-2 rounded-lg transition-colors ${
              mode === 'register'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <UserPlus className="mr-2 h-5 w-5" />
            登録
          </button>
          <button
            onClick={() => setMode('authenticate')}
            className={`flex items-center px-6 py-2 rounded-lg transition-colors ${
              mode === 'authenticate'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Scan className="mr-2 h-5 w-5" />
            認証
          </button>
        </div>

        {mode === 'register' ? (
          <Registration onRegister={handleRegister} />
        ) : (
          <Authentication users={users} />
        )}

        <div className="mt-8 text-center text-sm text-gray-600">
          登録済みユーザー数: {users.length}人
        </div>
      </div>
    </div>
  );
}

export default App;