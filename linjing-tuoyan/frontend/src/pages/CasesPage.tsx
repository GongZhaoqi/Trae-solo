import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCasesStore } from '@/stores';
import type { Case } from '@/types';

const CasesPage: React.FC = () => {
  const { cases, fetchCases, createCase, deleteCase, isLoading } = useCasesStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCases();
  }, []);

  const filteredCases = cases.filter((c) => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const handleStartTraining = (caseId: string) => {
    navigate(`/training/${caseId}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">病例管理</h1>
          <p className="text-gray-600 mt-1">管理系统中的临床病例和剧本</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          创建新病例
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setFilter('all')}
              className={`${
                filter === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              全部 ({cases.length})
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`${
                filter === 'draft'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              草稿 ({cases.filter((c) => c.status === 'draft').length})
            </button>
            <button
              onClick={() => setFilter('published')}
              className={`${
                filter === 'published'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              已发布 ({cases.filter((c) => c.status === 'published').length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">加载中...</p>
            </div>
          ) : filteredCases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {caseItem.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {caseItem.description}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs rounded-full font-medium ${getDifficultyColor(
                        caseItem.difficulty
                      )}`}
                    >
                      {caseItem.difficulty === 'easy'
                        ? '简单'
                        : caseItem.difficulty === 'medium'
                        ? '中等'
                        : '困难'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {caseItem.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    {caseItem.status === 'published' && (
                      <button
                        onClick={() => handleStartTraining(caseItem.id)}
                        className="btn-primary flex-1"
                      >
                        开始实训
                      </button>
                    )}
                    <button className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50">
                      编辑
                    </button>
                    <button
                      onClick={() => deleteCase(caseItem.id)}
                      className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">暂无病例数据</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 btn-primary"
              >
                创建第一个病例
              </button>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateCaseModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createCase}
        />
      )}
    </div>
  );
};

const CreateCaseModal: React.FC<{
  onClose: () => void;
  onCreate: (data: Partial<Case>) => Promise<void>;
}> = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    tags: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onCreate({
        ...formData,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        status: 'draft',
      });
      onClose();
    } catch (error) {
      console.error('Failed to create case:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">创建新病例</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              病例标题
            </label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="例如：急性心肌梗死护理"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              病例描述
            </label>
            <textarea
              required
              className="input-field"
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="详细描述病例情况..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              难度等级
            </label>
            <select
              className="input-field"
              value={formData.difficulty}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  difficulty: e.target.value as 'easy' | 'medium' | 'hard',
                })
              }
            >
              <option value="easy">简单</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标签（用逗号分隔）
            </label>
            <input
              type="text"
              className="input-field"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="例如：心内科, 急救, 老年护理"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 btn-primary"
            >
              {isSubmitting ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CasesPage;
