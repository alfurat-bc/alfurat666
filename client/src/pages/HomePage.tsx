import { Link } from 'react-router-dom';
import { ArrowRight, FileText, QrCode, BarChart3, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
          <Shield className="w-4 h-4" />
          <span>Academic Survey Platform</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Travel Habits of International Students
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Murdoch University International Student Travel Survey
        </p>
        <p className="text-gray-500 max-w-xl mx-auto mb-8">
          Participate in our academic research survey. Your responses help us understand 
          the travel patterns and preferences of international students at Murdoch University.
        </p>
      </div>

      {/* Survey card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-12">
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Current Survey</h2>
              <p className="text-primary-100">Available Now</p>
            </div>
          </div>
        </div>
        
        <div className="p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Travel Habits of International Students at Murdoch University
          </h3>
          <p className="text-gray-600 mb-6">
            This survey investigates the travel habits, preferences, and patterns of 
            international students studying at Murdoch University. It takes approximately 
            2-3 minutes to complete.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-primary-600">10</p>
              <p className="text-sm text-gray-500">Questions</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-primary-600">2-3</p>
              <p className="text-sm text-gray-500">Minutes</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-primary-600">100%</p>
              <p className="text-sm text-gray-500">Anonymous</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-primary-600">Academic</p>
              <p className="text-sm text-gray-500">Research</p>
            </div>
          </div>

          <Link 
            to="/survey/1"
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium px-8 py-4 rounded-xl transition-colors"
          >
            <span>Start Survey</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
            <QrCode className="w-6 h-6 text-primary-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Quick QR Access</h3>
          <p className="text-sm text-gray-600">
            Scan the QR code with any device to quickly access and complete the survey.
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Privacy Protected</h3>
          <p className="text-sm text-gray-600">
            All responses are anonymous and used only for academic research purposes.
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
            <BarChart3 className="w-6 h-6 text-primary-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Research Data</h3>
          <p className="text-sm text-gray-600">
            Your input helps provide valuable insights for academic research.
          </p>
        </div>
      </div>

      {/* Participant info */}
      <div className="bg-primary-50 rounded-xl p-6 border border-primary-100">
        <h4 className="font-semibold text-primary-900 mb-2">Participant Information</h4>
        <p className="text-sm text-primary-700 mb-4">
          Before participating, please read the Participant Information Sheet for details 
          about the study, your rights, and how your data will be used.
        </p>
        <Link 
          to="/info-sheet"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
        >
          <FileText className="w-4 h-4" />
          <span>View Participant Information Sheet</span>
        </Link>
      </div>
    </div>
  );
}
