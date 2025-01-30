import React, { useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { Scan, UserPlus, Trash2 } from 'lucide-react';
import Registration from './components/Registration';
import Authentication from './components/Authentication';
import { User } from './types';

const USERS_STORAGE_KEY = 'face-auth-users';

const serializeDescriptor = (descriptor: Float32Array): number[] => {
  return Array.from(descriptor);
};

const deserializeDescriptor = (array: number[]): Float32Array => {
  return new Float32Array(array);
};

function App() {
  const [mode, setMode] = useState<'register' | 'authenticate'>('register');
  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (savedUsers) {
      try {
        const parsedUsers = JSON.parse(savedUsers);
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

  useEffect(() => {
    try {
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

  const handleRemoveUser = (name: string) => {
    if (window.confirm(`${name}さんの登録を解除してもよろしいですか？`)) {
      setUsers(users.filter(user => user.name !== name));
    }
  };

  const handleReset = () => {
    if (window.confirm('全てのユーザー登録を初期化してもよろしいですか？\nこの操作は取り消せません。')) {
      setUsers([]);
    }
  };

  const checkNameExists = (name: string): boolean => {
    return users.some(user => user.name === name);
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
          <Registration onRegister={handleRegister} checkNameExists={checkNameExists} />
        ) : (
          <Authentication users={users} />
        )}

        {users.length > 0 && (
          <div className="mt-8 max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">登録済みユーザー</h3>
              <ul className="space-y-2">
                {users.map(user => (
                  <li key={user.name} className="flex justify-between items-center">
                    <span>{user.name}</span>
                    <button
                      onClick={() => handleRemoveUser(user.name)}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="登録解除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                onClick={handleReset}
                className="mt-4 w-full text-red-600 border border-red-600 rounded-lg py-2 hover:bg-red-50 transition-colors"
              >
                全ての登録を初期化
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;