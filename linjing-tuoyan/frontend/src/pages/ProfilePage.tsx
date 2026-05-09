import React, { useEffect } from 'react';
import { useAuthStore, useLearningStore } from '@/stores';

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const { profile, fetchProfile, isLoading } = useLearningStore();

  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id);
    }
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">个人中心</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center space-x-4">
                <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center text-3xl font-bold text-blue-600">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{user?.username}</h2>
                  <p className="text-blue-100">{user?.email}</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                    {user?.role === 'student' ? '学生' : user?.role === 'teacher' ? '教师' : '管理员'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">账号信息</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">用户ID</span>
                    <span className="font-medium">{user?.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">注册时间</span>
                    <span className="font-medium">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">加载学习数据中...</p>
              </div>
            ) : profile ? (
              <>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">总体表现</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {profile.overall_score}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">总体评分</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {profile.training_history.length}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">实训次数</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {profile.strengths.length}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">擅长领域</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600">
                        {profile.weaknesses.length}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">薄弱环节</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">技能评估</h3>
                  <div className="space-y-4">
                    <SkillBar label="护理评估" value={profile.skills.assessment} />
                    <SkillBar label="临床诊断" value={profile.skills.diagnosis} />
                    <SkillBar label="护理干预" value={profile.skills.intervention} />
                    <SkillBar label="沟通能力" value={profile.skills.communication} />
                    <SkillBar label="应急响应" value={profile.skills.emergency_response} />
                    <SkillBar label="文书记录" value={profile.skills.documentation} />
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">能力分析</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-2">擅长领域</h4>
                      {profile.strengths.length > 0 ? (
                        <ul className="list-disc list-inside text-sm text-green-800 space-y-1">
                          {profile.strengths.map((strength, idx) => (
                            <li key={idx}>{strength}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-green-700">暂无数据</p>
                      )}
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-semibold text-red-900 mb-2">薄弱环节</h4>
                      {profile.weaknesses.length > 0 ? (
                        <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                          {profile.weaknesses.map((weakness, idx) => (
                            <li key={idx}>{weakness}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-red-700">暂无数据</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">情绪模式分析</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">平均紧张度</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              profile.emotional_patterns.average_tension > 70
                                ? 'bg-red-500'
                                : profile.emotional_patterns.average_tension > 40
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${profile.emotional_patterns.average_tension}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {profile.emotional_patterns.average_tension}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">进步率</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${profile.emotional_patterns.improvement_rate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-green-600">
                          +{profile.emotional_patterns.improvement_rate}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">实训历史</h3>
                  {profile.training_history.length > 0 ? (
                    <div className="space-y-3">
                      {profile.training_history.slice(0, 5).map((record, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900">病例 #{record.case_id}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(record.completed_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-600">{record.score}分</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">暂无实训记录</p>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">暂无学习数据</p>
                <p className="text-sm text-gray-400 mt-2">开始实训后将自动生成学习画像</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SkillBar: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  const getColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-blue-500';
    if (value >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="text-gray-900 font-bold">{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`${getColor(value)} h-3 rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProfilePage;
