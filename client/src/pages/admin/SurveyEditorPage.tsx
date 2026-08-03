import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Eye } from 'lucide-react';
import api from '../../services/api';
import type { Question } from '../../types';

const QUESTION_TYPES = [
  { value: 'radio', label: '单选' },
  { value: 'checkbox', label: '多选' },
  { value: 'textarea', label: '长文本' },
  { value: 'text', label: '短文本' },
];

export default function SurveyEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [title, setTitle] = useState('Travel Habits of International Students at Murdoch University');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing && id) {
      fetchSurvey(parseInt(id));
    } else {
      loadDefaultTemplate();
    }
  }, [id]);

  const fetchSurvey = async (surveyId: number) => {
    try {
      const { survey } = await api.getSurvey(surveyId);
      setTitle(survey.title);
      setDescription(survey.description || '');
      setQuestions(typeof survey.questions === 'string' 
        ? JSON.parse(survey.questions) 
        : survey.questions);
    } catch (err) {
      setError('加载问卷失败');
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultTemplate = () => {
    const defaultQuestions: Question[] = [
      {
        id: 'q1',
        type: 'radio',
        text: 'How often do you travel during your studies?',
        options: ['Every week', '2-3 times per month', 'Once a month', 'A few times per semester', 'Rarely or never'],
        required: true
      },
      {
        id: 'q2',
        type: 'radio',
        text: 'What is your primary mode of transportation?',
        options: ['Personal car', 'Public bus', 'Train', 'Bicycle', 'Walking', 'Rideshare (Uber, etc.)'],
        required: true
      },
      {
        id: 'q3',
        type: 'checkbox',
        text: 'Which countries or regions have you visited while studying in Australia?',
        options: ['New Zealand', 'Singapore', 'Indonesia (Bali)', 'Malaysia', 'Thailand', 'Japan', 'South Korea', 'Other'],
        required: true
      },
      {
        id: 'q4',
        type: 'radio',
        text: 'What is your average travel budget per trip (AUD)?',
        options: ['Under $500', '$500 - $1,000', '$1,000 - $2,000', '$2,000 - $5,000', 'Over $5,000'],
        required: true
      },
      {
        id: 'q5',
        type: 'checkbox',
        text: 'Who do you usually travel with?',
        options: ['Alone', 'Friends from university', 'Friends from home country', 'Family members', 'Organized tour group'],
        required: true
      },
      {
        id: 'q6',
        type: 'checkbox',
        text: 'What factors influence your travel decisions?',
        options: ['Cost/Budget', 'Time availability', 'Weather/Season', 'Destination popularity', 'Cultural attractions', 'Adventure opportunities', 'Academic schedule'],
        required: true
      },
      {
        id: 'q7',
        type: 'radio',
        text: 'How do you usually book your travel arrangements?',
        options: ['Online travel platforms (Booking.com, Expedia, etc.)', 'Travel agency', 'Airline/Transport company websites', 'Social media recommendations', 'Direct contact with hotels/providers'],
        required: true
      },
      {
        id: 'q8',
        type: 'radio',
        text: 'What type of accommodation do you prefer when traveling?',
        options: ['Hotel', 'Hostel', 'Airbnb/ Vacation rental', 'Student dormitory/Hostel', 'Camping', 'Staying with friends/family'],
        required: true
      },
      {
        id: 'q9',
        type: 'checkbox',
        text: 'What activities do you enjoy most while traveling?',
        options: ['Sightseeing/Visiting landmarks', 'Beach activities', 'Hiking/Outdoor adventures', 'Food and cuisine exploration', 'Shopping', 'Cultural experiences/Museums', 'Nightlife/Entertainment'],
        required: true
      },
      {
        id: 'q10',
        type: 'textarea',
        text: 'Please share any memorable travel experiences at or near Murdoch University.',
        placeholder: 'Share your stories, favorite destinations, or travel tips for fellow international students...',
        required: false
      }
    ];
    setQuestions(defaultQuestions);
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q${questions.length + 1}`,
      type: 'radio',
      text: '',
      options: ['Option 1', 'Option 2'],
      required: true
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    setQuestions(questions.map((q, i) => i === index ? { ...q, ...updates } : q));
  };

  const deleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      alert('问卷至少需要一道题目');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addOption = (questionIndex: number) => {
    const question = questions[questionIndex];
    if (question.options) {
      updateQuestion(questionIndex, {
        options: [...question.options, `Option ${question.options.length + 1}`]
      });
    }
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const question = questions[questionIndex];
    if (question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionIndex, { options: newOptions });
    }
  };

  const deleteOption = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex];
    if (question.options && question.options.length > 2) {
      updateQuestion(questionIndex, {
        options: question.options.filter((_, i) => i !== optionIndex)
      });
    }
  };

  const handleSave = async (publish = false) => {
    setError('');
    setSaving(true);

    try {
      const surveyData = {
        title,
        description,
        questions: questions.map((q, i) => ({ ...q, id: `q${i + 1}` }))
      };

      if (isEditing && id) {
        await api.updateSurvey(parseInt(id), surveyData);
        if (publish) {
          await api.publishSurvey(parseInt(id), true);
        }
        navigate('/admin/surveys');
      } else {
        const result = await api.createSurvey(surveyData);
        if (publish) {
          await api.publishSurvey(result.survey.id, true);
        }
        navigate('/admin/surveys');
      }
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? '编辑问卷' : '创建问卷'}
            </h1>
            <p className="text-gray-500">设计您的调查问卷内容</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>保存草稿</span>
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving || publishing}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving || publishing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>发布中...</span>
              </>
            ) : (
              <span>保存并发布</span>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              问卷标题（英文）
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="Enter survey title in English"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              问卷描述（英文）
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
              placeholder="Brief description of the survey"
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">问卷题目</h2>
          <button
            onClick={addQuestion}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>添加题目</span>
          </button>
        </div>

        <div className="space-y-6">
          {questions.map((question, qIndex) => (
            <div key={qIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-start gap-4 mb-4">
                <div className="mt-2 text-gray-400 cursor-move">
                  <GripVertical className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 font-medium rounded-lg text-sm">
                      Q{qIndex + 1}
                    </span>
                    <select
                      value={question.type}
                      onChange={(e) => updateQuestion(qIndex, { 
                        type: e.target.value as Question['type'],
                        options: ['radio', 'checkbox'].includes(e.target.value) ? question.options : undefined
                      })}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    >
                      {QUESTION_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(e) => updateQuestion(qIndex, { required: e.target.checked })}
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                      <span>必填</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={question.text}
                    onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="Enter question text in English"
                  />
                </div>
                <button
                  onClick={() => deleteQuestion(qIndex)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {['radio', 'checkbox'].includes(question.type) && question.options && (
                <div className="ml-12 space-y-2">
                  <label className="text-sm font-medium text-gray-600">选项</label>
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                        placeholder={`Option ${oIndex + 1}`}
                      />
                      <button
                        onClick={() => deleteOption(qIndex, oIndex)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        disabled={question.options!.length <= 2}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addOption(qIndex)}
                    className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>添加选项</span>
                  </button>
                </div>
              )}

              {(question.type === 'text' || question.type === 'textarea') && (
                <div className="ml-12">
                  <label className="text-sm font-medium text-gray-600 mb-1 block">占位提示文字</label>
                  <input
                    type="text"
                    value={question.placeholder || ''}
                    onChange={(e) => updateQuestion(qIndex, { placeholder: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                    placeholder="Placeholder text (optional)"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">问卷预览</h2>
          {isEditing && id && (
            <Link
              to={`/survey/${id}`}
              target="_blank"
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
            >
              <Eye className="w-4 h-4" />
              <span>在新窗口预览</span>
            </Link>
          )}
        </div>
        <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500 text-sm">
          点击上方"保存并发布"后，可以在此页面查看二维码和数据
        </div>
      </div>
    </div>
  );
}
