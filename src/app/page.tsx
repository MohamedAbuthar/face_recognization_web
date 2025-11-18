'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 dark:text-white mb-4">
            Face Recognition
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
            Powered by MediaPipe AI
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real-time face detection with 468 facial landmarks
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Register Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="text-6xl mb-4">📸</div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                Register Face
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Register your face to the system for future recognition
              </p>
              <button
                onClick={() => router.push('/register')}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Start Registration
              </button>
            </div>
          </div>

          {/* Recognize Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                Recognize Face
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Identify registered faces using real-time face recognition
              </p>
              <button
                onClick={() => router.push('/recognize')}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                Start Recognition
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 text-center">
            Features
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="text-3xl mb-2">⚡</div>
              <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
                Real-time Detection
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                High-performance face detection using MediaPipe
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">🎯</div>
              <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
                468 Landmarks
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Precise facial landmark detection and mesh
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">🔒</div>
              <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
                Secure Storage
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Face embeddings stored securely in Firebase
              </p>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Built with Next.js, MediaPipe, TypeScript, and Firebase</p>
        </div>
      </div>
    </div>
  );
}
