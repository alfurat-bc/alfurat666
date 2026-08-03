import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import type { Survey, Question } from '../types';
import { CheckCircle2, ChevronLeft, ChevronRight, FileText, AlertCircle } from 'lucide-react';

export default function SurveyPage() {
  const { id } = useParams<{ id: string }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({});

  const questionsPerPage = 3;

  useEffect(() => {
    if (id) {
      fetchSurvey(parseInt(id));
    }
  }, [id]);

  const fetchSurvey = async (surveyId: number) => {
    try {
      const { survey } = await api.getSurvey(surveyId);
      survey.questions = typeof survey.questions === 'string' 
        ? JSON.parse(survey.questions) 
        : survey.questions;
      setSurvey(survey);
      setLoading(false);
    } catch (err) {
      setError('Survey not found or no longer available.');
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[parseInt(questionId.replace('q', '')) - 1];
      return newErrors;
    });
  };

  const validatePage = (): boolean => {
    if (!survey) return false;
    const pageQuestions = survey.questions.slice(
      currentPage * questionsPerPage,
      (currentPage + 1) * questionsPerPage
    );
    
    const errors: Record<number, string> = {};
    let isValid = true;

    pageQuestions.forEach((q, idx) => {
      if (q.required) {
        const actualIndex = currentPage * questionsPerPage + idx;
        const answer = answers[`q${actualIndex + 1}`];
        if (!answer || (Array.isArray(answer) && answer.length === 0) || answer === '') {
          errors[actualIndex] = 'This question is required';
          isValid = false;
        }
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleNext = () => {
    if (validatePage()) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentPage(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!survey) return;
    
    if (!validatePage()) return;

    setSubmitting(true);
    try {
      const formattedAnswers: Record<string, string | string[]> = {};
      survey.questions.forEach((q, idx) => {
        const answer = answers[`q${idx + 1}`];
        formattedAnswers[`q${idx + 1}`] = answer || (q.type === 'checkbox' ? [] : '');
      });

      await api.submitResponse(survey.id, formattedAnswers);
      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Survey Not Available</h1>
        <p className="text-gray-600 mb-6">{error || 'This survey could not be found.'}</p>
        <Link to="/" className="text-primary-600 hover:text-primary-700">
          Return to Home
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>
        <p className="text-lg text-gray-600 mb-8">
          Your response has been submitted successfully.<br />
          Your input is valuable for our academic research.
        </p>
        <Link 
          to="/"
          className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Return to Home</span>
        </Link>
      </div>
    );
  }

  const questions = survey.questions;
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const pageQuestions = questions.slice(
    currentPage * questionsPerPage,
    (currentPage + 1) * questionsPerPage
  );
  const isLastPage = currentPage === totalPages - 1;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">M</span>
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">Murdoch University</h1>
            <p className="text-sm text-gray-500">International Student Survey</p>
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{survey.title}</h2>
        <p className="text-gray-600 text-sm mb-4">{survey.description}</p>
        
        {/* Progress */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-500 transition-all duration-300"
                style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-sm text-gray-500">
            Question {currentPage * questionsPerPage + 1} - {Math.min((currentPage + 1) * questionsPerPage, questions.length)} of {questions.length}
          </span>
        </div>
      </div>

      {/* Participant Info Link */}
      <Link 
        to="/info-sheet"
        className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 mb-6"
      >
        <FileText className="w-4 h-4" />
        <span>View Participant Information Sheet</span>
      </Link>

      {/* Questions */}
      <div className="space-y-6">
        {pageQuestions.map((question, idx) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={currentPage * questionsPerPage + idx}
            value={answers[`q${currentPage * questionsPerPage + idx + 1}`]}
            onChange={(value) => handleAnswerChange(`q${currentPage * questionsPerPage + idx + 1}`, value)}
            error={validationErrors[currentPage * questionsPerPage + idx]}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={handlePrev}
          disabled={currentPage === 0}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Previous</span>
        </button>

        {isLastPage ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <span>Submit Survey</span>
                <CheckCircle2 className="w-5 h-5" />
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium px-6 py-2 rounded-lg transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Error message */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">Please answer all required questions before continuing.</p>
        </div>
      )}
    </div>
  );
}

interface QuestionCardProps {
  question: Question;
  index: number;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
  error?: string;
}

function QuestionCard({ question, index, value, onChange, error }: QuestionCardProps) {
  const questionNum = index + 1;

  return (
    <div className={`bg-white rounded-xl border p-6 transition-colors ${
      error ? 'border-red-300 bg-red-50' : 'border-gray-200'
    }`}>
      <div className="flex items-start gap-3 mb-4">
        <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center font-semibold text-sm">
          Q{questionNum}
        </span>
        <div className="flex-1">
          <p className="font-medium text-gray-900">
            {question.text}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-3 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}

      {question.type === 'radio' && question.options && (
        <div className="space-y-2 ml-11">
          {question.options.map((option, idx) => (
            <label 
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                value === option 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              <input
                type="radio"
                name={`q${questionNum}`}
                value={option}
                checked={value === option}
                onChange={(e) => onChange(e.target.value)}
                className="w-5 h-5 text-primary-600"
              />
              <span className="text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === 'checkbox' && question.options && (
        <div className="space-y-2 ml-11">
          {question.options.map((option, idx) => {
            const selected = Array.isArray(value) ? value : [];
            return (
              <label 
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selected.includes(option)
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-primary-300'
                }`}
              >
                <input
                  type="checkbox"
                  value={option}
                  checked={selected.includes(option)}
                  onChange={(e) => {
                    const newValue = e.target.checked
                      ? [...selected, option]
                      : selected.filter((v: string) => v !== option);
                    onChange(newValue);
                  }}
                  className="w-5 h-5 text-primary-600 rounded"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            );
          })}
        </div>
      )}

      {(question.type === 'text' || question.type === 'textarea') && (
        <div className="ml-11">
          <textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder || 'Enter your answer...'}
            rows={question.type === 'textarea' ? 4 : 2}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
          />
        </div>
      )}
    </div>
  );
}
