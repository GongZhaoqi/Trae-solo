import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTrainingStore, useAuthStore } from '@/stores';
import { scriptsApi } from '@/services/api';
import type { Script, ScriptScene, EmotionalState } from '@/types';

const TrainingPage: React.FC = () => {
  const { scriptId } = useParams<{ scriptId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentRecord,
    isTraining,
    startTraining,
    submitDecision,
    completeTraining,
    resetTraining,
  } = useTrainingStore();

  const [script, setScript] = useState<Script | null>(null);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [voiceInput, setVoiceInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [emotionalState, setEmotionalState] = useState<EmotionalState>({
    tension_level: 0,
    confidence_level: 50,
    calmness_level: 100,
  });
  const [multimodalEnabled, setMultimodalEnabled] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [sceneFeedback, setSceneFeedback] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (scriptId) {
      loadScript(scriptId);
    }
    return () => {
      resetTraining();
    };
  }, [scriptId]);

  const loadScript = async (id: string) => {
    try {
      const response = await scriptsApi.getById(id);
      if (response.success && response.data) {
        setScript(response.data);
      }
    } catch (error) {
      console.error('Failed to load script:', error);
    }
  };

  const handleStartTraining = async () => {
    if (scriptId) {
      await startTraining(scriptId);
      if (multimodalEnabled) {
        startMultimodalCapture();
      }
    }
  };

  const startMultimodalCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      processVideoFrame();
    } catch (error) {
      console.error('Failed to access camera:', error);
      console.log('无法访问摄像头，多模态功能不可用');
    }
  };

  const processVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current || !multimodalEnabled) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const tensionLevel = analyzeTension(imageData);
      setEmotionalState((prev) => ({
        ...prev,
        tension_level: tensionLevel,
      }));
    }

    requestAnimationFrame(processVideoFrame);
  };

  const analyzeTension = (imageData: ImageData): number => {
    let totalTension = 0;
    const data = imageData.data;
    const pixelCount = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      const tension = Math.abs(brightness - 128);
      totalTension += tension;
    }

    const avgTension = totalTension / pixelCount;
    return Math.min(Math.round((avgTension / 128) * 100), 100);
  };

  const toggleVoiceInput = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      startVoiceRecording();
    }
  };

  const startVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.log('语音识别不可用');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setVoiceInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    setIsRecording(true);
  };

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleSceneSubmit = async () => {
    if (!currentRecord || !script) return;

    const currentScene = script.scenes[currentSceneIndex];
    const decision = {
      scene_id: currentScene.id,
      option_id: selectedOption,
      voice_input: voiceInput,
      emotional_state: emotionalState,
      timestamp: new Date().toISOString(),
      dp_spent: currentScene.dp_cost,
    };

    await submitDecision(currentRecord.id, decision);

    const isOptimal = currentScene.options?.find(
      (opt) => opt.id === selectedOption
    )?.is_optimal;

    setSceneFeedback({
      is_optimal: isOptimal,
      option: currentScene.options?.find((opt) => opt.id === selectedOption),
      emotional_state: emotionalState,
      tension_detected: emotionalState.tension_level > 70,
    });
    setShowFeedback(true);
  };

  const handleNextScene = () => {
    setShowFeedback(false);
    setSelectedOption(null);
    setVoiceInput('');
    setSceneFeedback(null);

    if (script && currentSceneIndex < script.scenes.length - 1) {
      setCurrentSceneIndex((prev) => prev + 1);
    } else {
      handleCompleteTraining();
    }
  };

  const handleCompleteTraining = async () => {
    if (currentRecord) {
      await completeTraining(currentRecord.id);
      navigate('/dashboard');
    }
  };

  if (!script) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载剧本中...</p>
        </div>
      </div>
    );
  }

  const currentScene = script.scenes[currentSceneIndex];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">实训进行中</h1>
            <p className="text-gray-600 mt-1">{script.patient_info.name} - {currentScene.title}</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-500 hover:text-gray-700"
          >
            退出实训
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {!isTraining ? (
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {script.patient_info.name}
                </h2>
                <p className="text-gray-600 mb-2">
                  {script.patient_info.age}岁 {script.patient_info.gender === 'male' ? '男' : '女'}
                </p>
                <p className="text-lg text-gray-800 mb-6">
                  主诉：{script.patient_info.chief_complaint}
                </p>
                <button onClick={handleStartTraining} className="btn-primary text-lg px-8 py-3">
                  开始实训
                </button>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    {currentScene.type === 'assessment' ? '护理评估' :
                     currentScene.type === 'diagnosis' ? '临床诊断' :
                     currentScene.type === 'intervention' ? '护理干预' : '效果评价'}
                  </h3>
                  <p className="text-gray-700">{currentScene.description}</p>
                </div>

                <div className="space-y-3">
                  {currentScene.options?.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(option.id)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedOption === option.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-gray-800">{option.content}</span>
                        <span className="text-sm text-gray-500 ml-4">
                          {option.dp_cost} DP
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">语音输入（可选）</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input-field flex-1"
                      placeholder="输入病史信息或使用语音..."
                      value={voiceInput}
                      onChange={(e) => setVoiceInput(e.target.value)}
                    />
                    <button
                      onClick={toggleVoiceInput}
                      className={`px-4 py-2 rounded ${
                        isRecording
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      🎤
                    </button>
                  </div>
                </div>

                {selectedOption && (
                  <button onClick={handleSceneSubmit} className="btn-primary w-full text-lg py-3">
                    提交决策
                  </button>
                )}
              </>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">实时状态</h3>

              <div className="mb-4">
                <label className="flex items-center justify-between text-sm mb-1">
                  <span>DP预算</span>
                  <span className="font-medium">
                    {currentRecord?.total_dp_spent || 0} / {currentRecord?.dp_budget || script.total_dp_budget}
                  </span>
                </label>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${
                        ((currentRecord?.total_dp_spent || 0) /
                          (currentRecord?.dp_budget || script.total_dp_budget)) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="mb-4">
                <label className="flex items-center justify-between text-sm mb-1">
                  <span>紧张度</span>
                  <span className="font-medium">{emotionalState.tension_level}%</span>
                </label>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      emotionalState.tension_level > 70
                        ? 'bg-red-500'
                        : emotionalState.tension_level > 40
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${emotionalState.tension_level}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span>场景进度</span>
                <span className="font-medium">
                  {currentSceneIndex + 1} / {script.scenes.length}
                </span>
              </div>
            </div>

            {multimodalEnabled && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">表情识别</h3>
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full rounded-lg"
                    muted
                    playsInline
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <canvas
                    className="absolute top-2 right-2 w-24 h-18 bg-gray-800 rounded opacity-75"
                    ref={canvasRef}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {emotionalState.tension_level > 70
                    ? '⚠️ 检测到紧张情绪'
                    : '✓ 状态正常'}
                </p>
              </div>
            )}

            <button
              onClick={() => setMultimodalEnabled(!multimodalEnabled)}
              className={`w-full py-2 px-4 rounded border ${
                multimodalEnabled
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-gray-50 border-gray-300 text-gray-700'
              }`}
            >
              {multimodalEnabled ? '关闭表情识别' : '启用表情识别'}
            </button>
          </div>
        </div>
      </div>

      {showFeedback && sceneFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-center">
              {sceneFeedback.is_optimal ? '✓ 优秀！' : '⚠️ 继续加油'}
            </h2>

            <div className="space-y-4 mb-6">
              {sceneFeedback.tension_detected && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                  <p className="font-medium text-yellow-800">情绪分析</p>
                  <p className="text-yellow-700 mt-1">
                    检测到紧张情绪，可能需要在{' '}
                    {script.scenes[currentSceneIndex]?.required_skills.join(', ')}{' '}
                    方面加强训练
                  </p>
                </div>
              )}

              <div className="bg-gray-50 rounded p-3">
                <p className="font-medium text-gray-800 mb-1">你的选择</p>
                <p className="text-gray-600">{sceneFeedback.option?.content}</p>
              </div>

              {!sceneFeedback.is_optimal && sceneFeedback.option?.consequence && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="font-medium text-red-800 mb-1">后果</p>
                  <p className="text-red-700">{sceneFeedback.option.consequence}</p>
                </div>
              )}
            </div>

            <button
              onClick={handleNextScene}
              className="btn-primary w-full text-lg py-3"
            >
              {currentSceneIndex < script.scenes.length - 1 ? '下一场景' : '完成实训'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingPage;
