'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { FileText, Download, Eye, Search, X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { firestore } from '@/services/firebase';
import { AnimatePresence, motion } from 'framer-motion';
import { jsPDF } from 'jspdf';

interface VerificationResult {
  field: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

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
  results?: VerificationResult[];
  extractedText?: string;
  userName?: string;
}

export default function SubmissionsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

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

  const handleViewSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getResultStatusColor = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return 'bg-green-50 border-green-200';
      case 'fail':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  const downloadPDF = (submission: Submission) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Helper function to add text with auto-wrapping
    const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      
      const lines = doc.splitTextToSize(text, pageWidth - (margin * 2));
      
      // Check if we need a new page
      if (yPosition + (lines.length * fontSize * 0.5) > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * fontSize * 0.5 + 5;
    };

    const addSpace = (space: number = 5) => {
      yPosition += space;
    };

    // Header
    doc.setFillColor(0, 61, 122); // #003d7a
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('TTB Label Verification Report', margin, 20);
    
    yPosition = 40;
    doc.setTextColor(0, 0, 0);

    // Overall Status
    addText('OVERALL STATUS', 14, true);
    addText(`Status: ${submission.status}`);
    addText(`Verification Score: ${submission.verificationScore}%`);
    addText(`Submitted: ${formatDate(submission.submittedAt)}`);
    addSpace(10);

    // Product Information
    addText('PRODUCT INFORMATION', 14, true);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;
    
    addText(`Category: ${submission.productCategory}`, 10, true);
    addText(`Brand Name: ${submission.brandName}`);
    addText(`Product Type: ${submission.productType}`);
    addText(`Alcohol Content: ${submission.alcoholContent}% ABV`);
    addText(`Net Contents: ${submission.netContents}`);
    if (submission.userName) {
      addText(`Submitted By: ${submission.userName}`);
    }
    addSpace(10);

    // Verification Results
    if (submission.results && submission.results.length > 0) {
      addText('VERIFICATION RESULTS & DISCREPANCIES', 14, true);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;
      
      submission.results.forEach((result, index) => {
        // Status indicator
        const statusSymbol = result.status === 'pass' ? '✓' : result.status === 'fail' ? '✗' : '⚠';
        const statusColor = result.status === 'pass' ? [34, 197, 94] : result.status === 'fail' ? [239, 68, 68] : [234, 179, 8];
        
        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        addText(`${statusSymbol} ${result.field}`, 11, true);
        
        doc.setTextColor(0, 0, 0);
        addText(`   ${result.message}`, 10, false);
        addSpace(3);
      });
      
      addSpace(10);
    }

    // Extracted Text
    if (submission.extractedText) {
      addText('EXTRACTED TEXT FROM LABEL', 14, true);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;
      
      doc.setFontSize(8);
      doc.setFont('courier', 'normal');
      const extractedLines = doc.splitTextToSize(submission.extractedText, pageWidth - (margin * 2));
      
      extractedLines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 4;
      });
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${totalPages} | Generated on ${new Date().toLocaleString()}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      doc.text(
        '© 2025 Alcohol and Tobacco Tax and Trade Bureau (TTB)',
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      );
    }

    // Save the PDF
    const fileName = `TTB_Verification_${submission.brandName.replace(/\s+/g, '_')}_${submission.id.substring(0, 8)}.pdf`;
    doc.save(fileName);
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
                                <button 
                                  onClick={() => handleViewSubmission(submission)}
                                  className="p-2 text-[#003d7a] hover:bg-[#003d7a] hover:text-white rounded-lg transition-colors"
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => downloadPDF(submission)}
                                  className="p-2 text-[#003d7a] hover:bg-[#003d7a] hover:text-white rounded-lg transition-colors" 
                                  title="Download Report"
                                >
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

          {/* Submission Details Modal */}
          <AnimatePresence>
            {selectedSubmission && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedSubmission(null)}
                  className="fixed inset-0 bg-black/50 z-50"
                />

                {/* Modal */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ type: 'spring', duration: 0.3 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                >
                  <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden pointer-events-auto">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-[#003d7a]">
                      <div>
                        <h2 className="text-2xl font-semibold text-white">
                          Verification Details
                        </h2>
                        <p className="text-sm text-blue-100 mt-1">
                          {selectedSubmission.brandName} - {selectedSubmission.productType}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedSubmission(null)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <X className="h-6 w-6 text-white" />
                      </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                      {/* Overall Status */}
                      <div className={`mb-6 p-4 rounded-lg border-2 ${getStatusColor(selectedSubmission.status)}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Overall Status: {selectedSubmission.status}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Verification Score: {selectedSubmission.verificationScore}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Submitted</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(selectedSubmission.submittedAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Product Information */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h4>
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                          <div>
                            <p className="text-xs text-gray-500 uppercase">Category</p>
                            <p className="text-sm font-medium text-gray-900">{selectedSubmission.productCategory}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase">Brand Name</p>
                            <p className="text-sm font-medium text-gray-900">{selectedSubmission.brandName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase">Product Type</p>
                            <p className="text-sm font-medium text-gray-900">{selectedSubmission.productType}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase">Alcohol Content</p>
                            <p className="text-sm font-medium text-gray-900">{selectedSubmission.alcoholContent}% ABV</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase">Net Contents</p>
                            <p className="text-sm font-medium text-gray-900">{selectedSubmission.netContents}</p>
                          </div>
                          {selectedSubmission.userName && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase">Submitted By</p>
                              <p className="text-sm font-medium text-gray-900">{selectedSubmission.userName}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Verification Results */}
                      {selectedSubmission.results && selectedSubmission.results.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">
                            Verification Results & Discrepancies
                          </h4>
                          <div className="space-y-3">
                            {selectedSubmission.results.map((result, index) => (
                              <div
                                key={index}
                                className={`flex items-start gap-3 p-4 rounded-lg border ${getResultStatusColor(result.status)}`}
                              >
                                <div className="flex-shrink-0 mt-0.5">
                                  {getStatusIcon(result.status)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-sm font-semibold text-gray-900 mb-1">
                                    {result.field}
                                  </h5>
                                  <p className="text-sm text-gray-700">
                                    {result.message}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Extracted Text */}
                      {selectedSubmission.extractedText && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">
                            Extracted Text from Label
                          </h4>
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                              {selectedSubmission.extractedText}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Modal Footer */}
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                      <button
                        onClick={() => setSelectedSubmission(null)}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        Close
                      </button>
                      <button 
                        onClick={() => downloadPDF(selectedSubmission)}
                        className="px-4 py-2 bg-[#003d7a] text-white rounded-lg hover:bg-[#1e3a5f] transition-colors flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download Report
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

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
