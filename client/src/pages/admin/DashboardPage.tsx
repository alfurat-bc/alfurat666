import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, BarChart3, Plus, TrendingUp, QrCode, Clock } from 'lucide-react';
import api from '../../services/api';
import type { Survey } from '../../types';

export default function DashboardPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMySurveys();
  }, []);

  const fetchMySurveys = async () => {
    try {
      const { surveys } = await api.getMySurveys();
      setSurveys(surveys);
    } catch (error) {
      console.error('Failed to fetch surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalResponses = surveys.reduce((sum, s) => sum + (s.response_count || 0), 0);
  const publishedSurveys = surveys.filter(s => s.is_published).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
          <p className="text-gray-500 mt-1">查看您的问卷概览</p>
        </div>
        <Link
          to="/admin/surveys/create"
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>创建问卷</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">我的问卷</p>
              <p className="text-2xl font-bold text-gray-900">{surveys.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">已发布问卷</p>
              <p className="text-2xl font-bold text-gray-900">{publishedSurveys}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">总收集答卷</p>
              <p className="text-2xl font-bold text-gray-900">{totalResponses}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent surveys */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">我的问卷</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto"></div>
          </div>
        ) : surveys.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">您还没有创建任何问卷</p>
            <Link
              to="/admin/surveys/create"
              className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>创建第一个问卷</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {surveys.map((survey) => (
              <div key={survey.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-900 truncate">{survey.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        survey.is_published 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {survey.is_published ? '已发布' : '草稿'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
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
                  <div className="flex items-center gap-2 ml-4">
                    {survey.is_published && (
                      <Link
                        to={`/survey/${survey.id}`}
                        className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                        title="预览问卷"
                      >
                        <BarChart3 className="w-5 h-5" />
                      </Link>
                    )}
                    <Link
                      to={`/admin/surveys/edit/${survey.id}`}
                      className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                      title="编辑问卷"
                    >
                      <FileText className="w-5 h-5" />
                    </Link>
                    {survey.is_published && (
                      <Link
                        to={`/admin/surveys/responses/${survey.id}`}
                        className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                        title="查看数据"
                      >
                        <QrCode className="w-5 h-5" />
                      </Link>
                    )}
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
