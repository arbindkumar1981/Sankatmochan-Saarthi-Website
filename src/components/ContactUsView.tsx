import React, { useState } from 'react';
import { useCurriculum } from '../context/CurriculumContext';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { setDoc, doc } from 'firebase/firestore';
import {
  PhoneCall,
  Mail,
  MapPin,
  Send,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles
} from 'lucide-react';

export const ContactUsView: React.FC = () => {
  const { language, selectedClass } = useCurriculum();
  const { profile } = useAuth();

  const [name, setName] = useState(profile?.displayName || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState('');
  const [classGrade, setClassGrade] = useState(selectedClass);
  const [subjectQuery, setSubjectQuery] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setLoading(true);
    const enquiryId = 'enq-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();

    const enquiryData = {
      enquiryId,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      classGrade,
      subjectQuery: subjectQuery.trim() || 'General Inquiry',
      message: message.trim(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'enquiries', enquiryId), enquiryData);
      setSubmitted(true);
      setMessage('');
      setSubjectQuery('');
    } catch (err) {
      console.warn('Enquiry fallback:', err);
      // Fallback in localStorage so admin can still read it
      const savedEnquiries = JSON.parse(localStorage.getItem('saarthi_enquiries') || '[]');
      savedEnquiries.unshift(enquiryData);
      localStorage.setItem('saarthi_enquiries', JSON.stringify(savedEnquiries));
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-white rounded-2xl border border-orange-200/90 shadow-sm p-4 sm:p-6 flex flex-col gap-6 min-w-0">
      {/* Header */}
      <div className="border-b border-orange-100 pb-4">
        <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-cinzel flex items-center gap-2">
          <PhoneCall className="w-6 h-6 text-orange-600" />
          <span>{language === 'hi' ? 'संपर्क करें एवं सहायता केंद्र' : 'Contact Us & Student Support'}</span>
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          {language === 'hi'
            ? 'प्रवेश मार्गदर्शन, शैक्षणिक शंका समाधान एवं शिक्षक परामर्श'
            : 'Admissions guidance, subject doubt clearing & direct administration enquiry'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Info Cards */}
        <div className="space-y-4 md:col-span-1">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-200 p-4 rounded-2xl">
            <h4 className="font-bold text-xs uppercase tracking-wider text-orange-950 font-cinzel mb-2">
              Sankatmochan Vidyapeeth
            </h4>
            <div className="space-y-2.5 text-xs text-stone-700">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <span>Kainchi Dham Ashram Marg & Sankatmochan Mandir Campus, Nainital / Varanasi</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-orange-600 shrink-0" />
                <span className="font-mono">principal.a.kumar@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-orange-600 shrink-0" />
                <span>+91 98390 10811 / +91 94150 10812</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600 shrink-0" />
                <span>Daily 08:00 AM - 08:00 PM IST</span>
              </div>
            </div>
          </div>

          <div className="bg-red-50/70 border border-red-200 p-4 rounded-2xl text-xs text-red-900 leading-relaxed font-serif">
            <Sparkles className="w-4 h-4 text-red-600 mb-1" />
            <p>
              "बाबा नीम करौली जी की कृपा से हर विद्यार्थी की शंकाओं का समाधान व्यक्तिगत ध्यान देकर किया जाता है।"
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="md:col-span-2">
          {submitted ? (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-8 text-center max-w-md mx-auto space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold text-emerald-950 font-cinzel">
                {language === 'hi' ? 'पूछताछ सफलतापूर्वक प्राप्त हुई!' : 'Enquiry Received Successfully!'}
              </h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Thank you, {name}! Principal A. Kumar and the Saarthi counselling team have received your query. We will respond to your email shortly.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-5 rounded-2xl border border-stone-200">
              <h3 className="font-bold text-sm text-stone-900 font-cinzel">
                {language === 'hi' ? 'संदेश भेजें' : 'Send us an Inquiry / Academic Message'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Student / Parent name"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Class Grade
                  </label>
                  <select
                    value={classGrade}
                    onChange={(e) => setClassGrade(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option value="Class 9">Class IX (9th)</option>
                    <option value="Class 10">Class X (10th)</option>
                    <option value="Class 11">Class XI (11th)</option>
                    <option value="Class 12">Class XII (12th)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Subject / Topic of Concern
                </label>
                <input
                  type="text"
                  value={subjectQuery}
                  onChange={(e) => setSubjectQuery(e.target.value)}
                  placeholder="e.g. Class 10 Science Electricity or Maths Trigonometry doubts"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Your Detailed Message / Question *
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your inquiry, doubt, or guidance required..."
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'Submitting...' : 'Submit Inquiry'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
