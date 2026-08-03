import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, Clock, Users, QrCode, Trash2, ExternalLink } from 'lucide-react';
import api from '../../services/api';
import type { Survey } from '../../types';

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const { surveys } = await api.getMySurveys();
      setSurveys(surveys);
    } catch (error) {
      console.error('Failed to fetch surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个问卷吗？此操作不可撤销。')) return;
    
    try {
      await api.deleteSurvey(id);
      setSurveys(prev => prev.filter(s => s.id !== id));
      setDeleteId(null);
    } catch (error) {
      alert('删除失败，请重试');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">问卷管理</h1>
          <p className="text-gray-500 mt-1">创建和管理您的调查问卷</p>
        </div>
        <Link
          to="/admin/surveys/create"
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>创建问卷</span>
        </Link>
      </div>

      {/* Surveys list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">我的问卷</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto"></div>
          </div>
        ) : surveys.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无问卷</h3>
            <p className="text-gray-500 mb-6">开始创建您的第一个调查问卷</p>
            <Link
              to="/admin/surveys/create"
              className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>创建问卷</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {surveys.map((survey) => (
              <div key={survey.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{survey.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                        survey.is_published 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {survey.is_published ? '已发布' : '草稿'}
                      </span>
                    </div>
                    
                    {survey.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{survey.description}</p>
                    )}
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(survey.created_at).toLocaleDateString('zh-CN')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {survey.response_count || 0} 份答卷
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {survey.is_published && (
                      <>
                        <Link
                          to={`/survey/${survey.id}`}
                          target="_blank"
                          className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                          title="预览问卷"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </Link>
                        <Link
                          to={`/admin/surveys/responses/${survey.id}`}
                          className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                          title="查看数据与二维码"
                        >
                          <QrCode className="w-5 h-5" />
                        </Link>
                      </>
                    )}
                    <Link
                      to={`/admin/surveys/edit/${survey.id}`}
                      className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                      title="编辑问卷"
                    >
                      <FileText className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(survey.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="删除问卷"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
