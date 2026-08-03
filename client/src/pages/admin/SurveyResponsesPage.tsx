import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, QrCode, FileText, Printer, BarChart2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api';
import type { Analytics, Survey } from '../../types';
import AnalyticsChart from '../../components/AnalyticsChart';

export default function SurveyResponsesPage() {
  const { id } = useParams<{ id: string }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [surveyUrl, setSurveyUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chart' | 'qrcode'>('chart');

  useEffect(() => {
    if (id) {
      fetchData(parseInt(id));
    }
  }, [id]);

  const fetchData = async (surveyId: number) => {
    try {
      const [surveyRes, analyticsRes, qrRes] = await Promise.all([
        api.getSurvey(surveyId),
        api.getAnalytics(surveyId).catch(() => null),
        api.getQRCode(surveyId).catch(() => null)
      ]);
      
      surveyRes.survey.questions = typeof surveyRes.survey.questions === 'string'
        ? JSON.parse(surveyRes.survey.questions)
        : surveyRes.survey.questions;
      
      setSurvey(surveyRes.survey);
      setAnalytics(analyticsRes);
      setQrCode(qrRes?.qrCode || '');
      setSurveyUrl(qrRes?.surveyUrl || '');
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCode) return;
    
    const link = document.createElement('a');
    link.download = `survey-${id}-qrcode.png`;
    link.href = qrCode;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">问卷不存在或已被删除</p>
        <Link to="/admin/surveys" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
          返回问卷列表
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/surveys"
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">问卷数据</h1>
            <p className="text-gray-500 mt-1">{survey.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors no-print"
          >
            <Printer className="w-4 h-4" />
            <span>打印PDF</span>
          </button>
          <a
            href={api.getExportUrl(parseInt(id!))}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors no-print"
          >
            <Download className="w-4 h-4" />
            <span>导出CSV</span>
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">收集答卷</p>
          <p className="text-3xl font-bold text-gray-900">{analytics?.totalResponses || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">题目数量</p>
          <p className="text-3xl font-bold text-gray-900">{survey.questions.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">状态</p>
          <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 font-medium rounded-full">
            {survey.is_published ? '已发布' : '未发布'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-200 no-print">
        <button
          onClick={() => setActiveTab('chart')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'chart'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5" />
            <span>数据分析</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('qrcode')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'qrcode'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            <span>二维码</span>
          </div>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'chart' && analytics && (
        <div className="space-y-8">
          {analytics.analytics.map((item, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 avoid-break">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Q{index + 1}: {item.question}
              </h3>
              <AnalyticsChart data={item} />
            </div>
          ))}
        </div>
      )}

      {activeTab === 'qrcode' && (
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">问卷二维码</h2>
            
            {/* QR Code */}
            <div className="bg-white p-6 rounded-xl border-2 border-dashed border-gray-300 inline-block mb-6">
              {qrCode ? (
                <img src={qrCode} alt="QR Code" className="w-64 h-64" />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded">
                  <QRCodeSVG 
                    value={`${window.location.origin}/survey/${id}`}
                    size={256}
                    level="M"
                  />
                </div>
              )}
            </div>

            {/* URL */}
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">问卷链接</p>
              <p className="text-sm text-gray-900 break-all bg-gray-50 p-3 rounded-lg">
                {surveyUrl || `${window.location.origin}/survey/${id}`}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center no-print">
              <button
                onClick={downloadQRCode}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>下载二维码</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>打印问卷</span>
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-primary-50 rounded-xl p-6 border border-primary-100">
            <h3 className="font-semibold text-primary-900 mb-3">二维码使用说明</h3>
            <ul className="text-sm text-primary-800 space-y-2">
              <li>• 扫描此二维码可快速访问问卷</li>
              <li>• 支持微软扫码APP、手机相机、WhatsApp、Telegram等</li>
              <li>• 二维码永久有效，修改问卷内容后依然可用</li>
              <li>• 可下载高清PNG图片用于打印或分享</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
