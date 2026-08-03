import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Printer } from 'lucide-react';

export default function ParticipantInfo() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Actions - hidden when printing */}
      <div className="flex items-center justify-between mb-8 no-print">
        <Link 
          to="/"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Survey</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Document */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 avoid-break">
        {/* Header */}
        <div className="text-center border-b border-gray-200 pb-6 mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div className="text-left">
              <h1 className="text-lg font-semibold text-gray-900">Murdoch University</h1>
              <p className="text-sm text-gray-500">Perth, Western Australia</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
            Participant Information Sheet
          </h2>
        </div>

        {/* Content */}
        <div className="prose prose-gray max-w-none">
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Study Title</h3>
            <p className="text-gray-700">
              Travel Habits of International Students at Murdoch University
            </p>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Researcher</h3>
            <p className="text-gray-700">
              School of Business and Engineering, Murdoch University
            </p>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">What is this study about?</h3>
            <p className="text-gray-700">
              This survey aims to understand the travel habits, preferences, and patterns of 
              international students studying at Murdoch University. Your responses will help us 
              better understand how students balance their academic commitments with travel 
              experiences during their time in Australia.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Why have I been invited to participate?</h3>
            <p className="text-gray-700">
              You have been invited because you are an international student currently enrolled 
              at Murdoch University. Your experiences and opinions are valuable to this research.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">What will I be asked to do?</h3>
            <p className="text-gray-700 mb-3">
              You will be asked to complete a brief survey about your travel habits. The survey 
              includes questions about:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Frequency of travel</li>
              <li>Transportation preferences</li>
              <li>Travel destinations</li>
              <li>Budget considerations</li>
              <li>Travel companions and activities</li>
            </ul>
            <p className="text-gray-700 mt-3">
              The survey takes approximately 2-3 minutes to complete.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Are there any risks?</h3>
            <p className="text-gray-700">
              There are no known risks associated with participating in this study. All responses 
              are anonymous and will only be used for academic research purposes.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Do I have to participate?</h3>
            <p className="text-gray-700">
              Participation in this study is entirely voluntary. You may withdraw at any time 
              without penalty by closing your browser. However, once you submit your responses, 
              your data cannot be withdrawn as it is anonymized.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">How will my information be kept confidential?</h3>
            <p className="text-gray-700">
              All responses are collected anonymously. No personal identifying information will 
              be collected or stored. Your IP address and device information are not linked 
              to your responses.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">What will happen to the information I provide?</h3>
            <p className="text-gray-700">
              Your responses will be aggregated with those of other participants and used in 
              academic publications, presentations, and reports. No individual responses will 
              be identified.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">What do I do if I have concerns about the study?</h3>
            <p className="text-gray-700">
              If you have any questions or concerns about this research, please contact the 
              research team through your course coordinator.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Ethical clearance</h3>
            <p className="text-gray-700">
              This study has been reviewed and approved by Murdoch University's Human Research 
              Ethics Committee.
            </p>
          </section>

          <section className="mb-8 p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <h3 className="text-lg font-semibold text-primary-900 mb-3">Consent</h3>
            <p className="text-primary-800">
              By completing and submitting this survey, you indicate that:
            </p>
            <ul className="list-disc list-inside text-primary-800 space-y-1 mt-2 ml-4">
              <li>You understand the information provided above</li>
              <li>You are at least 18 years of age</li>
              <li>You voluntarily agree to participate in this research</li>
            </ul>
          </section>

          <div className="text-center text-gray-500 text-sm pt-6 border-t border-gray-200">
            <p>Thank you for your participation!</p>
            <p className="mt-2">Murdoch University | Perth, Western Australia</p>
          </div>
        </div>
      </div>

      {/* Footer - hidden when printing */}
      <div className="mt-6 text-center no-print">
        <Link 
          to="/survey/1"
          className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          <span>Start Survey</span>
        </Link>
      </div>
    </div>
  );
}
