'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { FileText, Download, Eye, Search } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { firestore } from '@/services/firebase';

interface Submission {
  id: string;
  brandName: string;
  productType: string;
  productCategory: string;
  submittedAt: any;
  status: string;
  alcoholContent: string;
  netContents: string;
  verificationScore: number;
}

export default function SubmissionsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchSubmissions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('🔍 Fetching submissions for user:', user.uid);
      
      // Fetch from: users/{userId}/submissions
      const userSubmissionsRef = collection(firestore, 'users', user.uid, 'submissions');
      const q = query(userSubmissionsRef, orderBy('submittedAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const submissionsData: Submission[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('📄 Found submission:', doc.id, data);
        submissionsData.push({
          id: doc.id,
          ...data
        } as Submission);
      });
      
      setSubmissions(submissionsData);
      console.log(`✅ Loaded ${submissionsData.length} submissions for user ${user.uid}`);
    } catch (error: any) {
      console.error('❌ Error fetching submissions:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [user]);

  // Auto-refresh every 5 seconds to catch new submissions
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        fetchSubmissions();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  // Filter submissions
  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch = submission.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.productType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || submission.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <ProtectedRoute>
      <AppSidebar>
        <div className="flex flex-col min-h-screen">
          <Header />

          <main className="flex-1 py-12 px-6">
            <div className="w-full max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-semibold text-[#212529] mb-2">
                  Past Submissions
                </h1>
                <p className="text-[#6c757d]">
                  View and manage your label verification history
                </p>
              </div>

              {/* Search and Filter */}
              <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search by brand name or product type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-[#212529] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d7a]"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-[#212529] focus:outline-none focus:ring-2 focus:ring-[#003d7a]"
                  >
                    <option value="all">All Status</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Pending">Pending</option>
                  </select>
                  <button
                    onClick={fetchSubmissions}
                    className="px-4 py-3 bg-[#003d7a] text-white rounded-lg hover:bg-[#1e3a5f] transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {/* Submissions Table */}
              {loading ? (
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003d7a] mx-auto mb-4"></div>
                  <p className="text-[#6c757d]">Loading submissions...</p>
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#212529] mb-2">
                    No submissions found
                  </h3>
                  <p className="text-[#6c757d]">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'Try adjusting your search or filters'
                      : 'Start by submitting your first label for verification'}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-[#6c757d] uppercase tracking-wider">
                            Brand Name
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-[#6c757d] uppercase tracking-wider">
                            Product Type
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-[#6c757d] uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-[#6c757d] uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-[#6c757d] uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-[#6c757d] uppercase tracking-wider">
                            ABV
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-[#6c757d] uppercase tracking-wider">
                            Score
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-[#6c757d] uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredSubmissions.map((submission) => (
                          <tr key={submission.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#212529]">
                              {submission.brandName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6c757d]">
                              {submission.productType}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6c757d]">
                              {submission.productCategory}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6c757d]">
                              {formatDate(submission.submittedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(submission.status)}`}>
                                {submission.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6c757d]">
                              {submission.alcoholContent}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      submission.verificationScore >= 90
                                        ? 'bg-green-500'
                                        : submission.verificationScore >= 70
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                    }`}
                                    style={{ width: `${submission.verificationScore}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-[#6c757d] min-w-[3ch]">
                                  {submission.verificationScore}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex gap-2">
                                <button className="p-2 text-[#003d7a] hover:bg-[#003d7a] hover:text-white rounded-lg transition-colors">
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button className="p-2 text-[#003d7a] hover:bg-[#003d7a] hover:text-white rounded-lg transition-colors">
                                  <Download className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </main>

          <footer className="py-6 border-t border-gray-300 bg-[#003d7a] text-white mt-auto">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm">
                  © 2025 Alcohol and Tobacco Tax and Trade Bureau (TTB)
                </div>
                <div className="flex gap-6 text-sm">
                  <a href="#" className="hover:underline">Privacy Policy</a>
                  <a href="#" className="hover:underline">Terms of Service</a>
                  <a href="#" className="hover:underline">Contact</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </AppSidebar>
    </ProtectedRoute>
  );
}
