import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useCasesStore, useLearningStore } from '@/stores';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { cases, fetchCases, isLoading: casesLoading } = useCasesStore();
  const { profile, fetchProfile, isLoading: profileLoading } = useLearningStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCases();
    if (user?.id) {
      fetchProfile(user.id);
    }
  }, [user?.id]);

  const recentCases = cases.slice(0, 3);

  const handleStartTraining = (scriptId: string) => {
    navigate(`/training/${scriptId}`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          欢迎回来, {user?.username || '用户'}
        </h1>
        <p className="text-gray-600">
          这里是您的学习仪表盘，可以查看学习进度和开始新的实训
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">总体评分</h3>
          <div className="text-4xl font-bold text-blue-600">
            {profile?.overall_score || 0}
          </div>
          <p className="text-sm text-gray-500 mt-2">基于所有实训表现</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">实训次数</h3>
          <div className="text-4xl font-bold text-purple-600">
            {profile?.training_history?.length || 0}
          </div>
          <p className="text-sm text-gray-500 mt-2">已完成实训总数</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">薄弱项</h3>
          <div className="text-sm text-red-600">
            {profile?.weaknesses?.slice(0, 2).join(', ') || '暂无'}
          </div>
          <p className="text-sm text-gray-500 mt-2">需要加强的技能</p>
        </div>
      </div>

      {profileLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载学习数据中...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">技能评估</h2>
          {profile?.skills ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <SkillBar label="护理评估" value={profile.skills.assessment} />
              <SkillBar label="临床诊断" value={profile.skills.diagnosis} />
              <SkillBar label="护理干预" value={profile.skills.intervention} />
              <SkillBar label="沟通能力" value={profile.skills.communication} />
              <SkillBar label="应急响应" value={profile.skills.emergency_response} />
              <SkillBar label="文书记录" value={profile.skills.documentation} />
            </div>
          ) : (
            <p className="text-gray-500">暂无技能评估数据</p>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">推荐实训</h2>
        {casesLoading ? (
          <p className="text-gray-500">加载中...</p>
        ) : recentCases.length > 0 ? (
          <div className="space-y-4">
            {recentCases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {caseItem.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {caseItem.description}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                        {caseItem.difficulty}
                      </span>
                      {caseItem.tags?.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleStartTraining(caseItem.id)}
                    className="btn-primary ml-4"
                  >
                    开始实训
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">暂无推荐实训</p>
        )}
      </div>
    </div>
  );
};

const SkillBar: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium text-gray-900">{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(value, 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

export default DashboardPage;
