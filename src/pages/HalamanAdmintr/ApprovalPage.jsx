import React, { useState } from 'react';
import { 
  FileText, Download, Upload, Check, X, Clock, User, Calendar, 
  Building, BookOpen, MessageSquare, Eye, ChevronDown, ChevronUp,
  CheckCircle, XCircle, AlertCircle, Paperclip
} from 'lucide-react';

export default function ApprovalPage() {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState('');
  const [comments, setComments] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedRequest, setExpandedRequest] = useState(null);

  // Sample data registrasi yang perlu approval
  const [registrationRequests, setRegistrationRequests] = useState([
    {
      id: 1,
      nama: "Ahmad Ridwan",
      tanggal: "2025-09-15",
      jamMulai: "09:00",
      jamSelesai: "17:00",
      unit: "IT Department",
      kelas: "Technical Training",
      judul: "Advanced React Development and Best Practices",
      submitDate: "2025-08-28",
      status: "pending",
      requestedBy: "ahmad.ridwan@company.com",
      attachments: ["CV_Ahmad_Ridwan.pdf", "Certificate_React.pdf"]
    },
    {
      id: 2,
      nama: "Siti Nurhaliza",
      tanggal: "2025-09-20",
      jamMulai: "13:00",
      jamSelesai: "16:00",
      unit: "Human Resources",
      kelas: "Leadership Training",
      judul: "Team Leadership and Management Skills",
      submitDate: "2025-08-27",
      status: "pending",
      requestedBy: "siti.nurhaliza@company.com",
      attachments: ["Portfolio_Leadership.pdf"]
    },
    {
      id: 3,
      nama: "Budi Santoso",
      tanggal: "2025-09-18",
      jamMulai: "08:00",
      jamSelesai: "12:00",
      unit: "Finance",
      kelas: "Basic Training",
      judul: "Financial Analysis and Reporting",
      submitDate: "2025-08-26",
      status: "approved",
      requestedBy: "budi.santoso@company.com",
      attachments: ["Finance_Background.pdf"],
      approvedDate: "2025-08-28",
      approvedBy: "supervisor@company.com"
    }
  ]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setAttachedFiles(prev => [...prev, ...files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    }))]);
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleApproval = (requestId, status) => {
    setIsProcessing(true);
    
    setTimeout(() => {
      setRegistrationRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { 
                ...req, 
                status: status,
                approvedDate: new Date().toISOString().split('T')[0],
                approvedBy: "supervisor@company.com",
                approvalComments: comments,
                approvalAttachments: attachedFiles
              }
            : req
        )
      );
      
      setIsProcessing(false);
      setSelectedRequest(null);
      setComments('');
      setAttachedFiles([]);
      setApprovalStatus('');
      
      alert(`Registrasi ${status === 'approved' ? 'disetujui' : 'ditolak'} berhasil!`);
    }, 2000);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Training Approval Center</h1>
          <p className="text-blue-100">Kelola persetujuan registrasi training karyawan</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Request List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Daftar Registrasi Training
              </h2>
              
              <div className="space-y-3">
                {registrationRequests.map((request) => (
                  <div key={request.id} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">{request.nama}</h3>
                          <p className="text-blue-200 text-sm">{request.requestedBy}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span>{request.status === 'approved' ? 'Disetujui' : request.status === 'rejected' ? 'Ditolak' : 'Menunggu'}</span>
                        </span>
                        <button
                          onClick={() => setExpandedRequest(expandedRequest === request.id ? null : request.id)}
                          className="text-blue-300 hover:text-white p-1 rounded"
                        >
                          {expandedRequest === request.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {expandedRequest === request.id && (
                      <div className="space-y-3 border-t border-white/10 pt-3 mt-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center text-blue-200">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>Tanggal: {request.tanggal}</span>
                          </div>
                          <div className="flex items-center text-blue-200">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>Waktu: {request.jamMulai} - {request.jamSelesai}</span>
                          </div>
                          <div className="flex items-center text-blue-200">
                            <Building className="w-4 h-4 mr-2" />
                            <span>Unit: {request.unit}</span>
                          </div>
                          <div className="flex items-center text-blue-200">
                            <BookOpen className="w-4 h-4 mr-2" />
                            <span>Kelas: {request.kelas}</span>
                          </div>
                        </div>
                        
                        <div className="text-blue-200">
                          <p className="font-medium mb-1">Judul Materi:</p>
                          <p className="text-sm bg-white/5 rounded-lg p-2">{request.judul}</p>
                        </div>

                        {request.attachments && request.attachments.length > 0 && (
                          <div className="text-blue-200">
                            <p className="font-medium mb-2">File Lampiran:</p>
                            <div className="flex flex-wrap gap-2">
                              {request.attachments.map((file, index) => (
                                <div key={index} className="flex items-center bg-white/5 rounded-lg px-3 py-1 text-xs">
                                  <Paperclip className="w-3 h-3 mr-1" />
                                  <span>{file}</span>
                                  <button className="ml-2 text-blue-400 hover:text-blue-300">
                                    <Download className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {request.status === 'pending' && (
                          <div className="flex space-x-2 pt-2">
                            <button
                              onClick={() => setSelectedRequest(request)}
                              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-1"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Review & Approve</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Approval Panel */}
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Panel Approval</h2>
              
              {selectedRequest ? (
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <h3 className="text-white font-medium mb-2">Detail Registrasi</h3>
                    <div className="space-y-2 text-sm text-blue-200">
                      <p><span className="font-medium">Nama:</span> {selectedRequest.nama}</p>
                      <p><span className="font-medium">Training:</span> {selectedRequest.judul}</p>
                      <p><span className="font-medium">Tanggal:</span> {selectedRequest.tanggal}</p>
                    </div>
                  </div>

                  {/* Comments */}
                  <div className="space-y-2">
                    <label className="text-white text-sm font-medium flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Komentar Approval
                    </label>
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Berikan komentar atau catatan untuk keputusan ini..."
                      rows={3}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm resize-none text-sm"
                    />
                  </div>

                  {/* File Upload */}
                  <div className="space-y-2">
                    <label className="text-white text-sm font-medium flex items-center">
                      <Upload className="w-4 h-4 mr-2" />
                      Lampiran Tambahan
                    </label>
                    <div className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center hover:border-white/40 transition-colors duration-200">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-blue-300 mx-auto mb-2" />
                        <p className="text-blue-200 text-sm">Klik untuk upload file</p>
                        <p className="text-blue-300 text-xs">PDF, DOC, JPG (Max 5MB)</p>
                      </label>
                    </div>
                    
                    {attachedFiles.length > 0 && (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {attachedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-2 text-sm">
                            <div className="flex items-center text-blue-200">
                              <FileText className="w-4 h-4 mr-2" />
                              <span className="truncate">{file.name}</span>
                              <span className="ml-2 text-xs text-blue-300">({formatFileSize(file.size)})</span>
                            </div>
                            <button
                              onClick={() => removeFile(index)}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4">
                    <button
                      onClick={() => handleApproval(selectedRequest.id, 'approved')}
                      disabled={isProcessing}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          <span>Setujui Registrasi</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleApproval(selectedRequest.id, 'rejected')}
                      disabled={isProcessing}
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <X className="w-5 h-5" />
                          <span>Tolak Registrasi</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-xl transition-all duration-300 border border-white/20"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-blue-300 mx-auto mb-4 opacity-50" />
                  <p className="text-blue-200">Pilih registrasi untuk direview</p>
                </div>
              )}
            </div>

            {/* Stats Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
              <h3 className="text-white font-semibold mb-4">Statistik</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-200">Total Registrasi</span>
                  <span className="text-white font-medium">{registrationRequests.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-200">Menunggu Approval</span>
                  <span className="text-yellow-400 font-medium">
                    {registrationRequests.filter(r => r.status === 'pending').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-200">Disetujui</span>
                  <span className="text-green-400 font-medium">
                    {registrationRequests.filter(r => r.status === 'approved').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-200">Ditolak</span>
                  <span className="text-red-400 font-medium">
                    {registrationRequests.filter(r => r.status === 'rejected').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}