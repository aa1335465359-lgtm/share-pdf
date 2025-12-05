import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Zap, ShieldCheck, Smartphone, FileSpreadsheet } from 'lucide-react';
import { uploadFile } from '../services/leancloudService';
import { Button } from '../components/Button';

export const UploadView: React.FC = () => {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File): boolean => {
    const validTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv'
    ];
    // Check by mime type or extension as backup
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isExcel = 
      file.type.includes('spreadsheet') || 
      file.type.includes('excel') || 
      file.name.match(/\.(xlsx|xls|csv)$/i);

    if (!isPdf && !isExcel) {
      setError("仅支持 PDF 或 Excel 文件");
      return false;
    }
    
    if (file.size > 20 * 1024 * 1024) { 
      setError("文件过大，请上传 20MB 以内的文件");
      return false;
    }
    return true;
  };

  const processFile = async (file: File) => {
    if (!validateFile(file)) return;

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      const result = await uploadFile(file, (percent) => {
        setProgress(percent);
      });
      // Small delay to show 100%
      setTimeout(() => {
        navigate(`/view/${result.objectId}`);
      }, 500);
    } catch (err: any) {
      setError(err.message || "上传失败，请重试");
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []); 

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF4F0] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2 animate-blob"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/2 -translate-y-1/2 animate-blob animation-delay-2000"></div>
      
      <div className="w-full max-w-xl relative z-10">
        <div className="text-center mb-10">
          <div className="inline-block p-3 rounded-2xl bg-white shadow-sm mb-4">
            <span className="text-4xl">🍅</span>
          </div>
          <h1 className="text-4xl font-bold text-stone-800 tracking-tight mb-3">番茄快传</h1>
          <p className="text-stone-500 text-lg">支持 PDF、Excel 极速分享与在线预览</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-red-500/5 p-8 border border-white">
          <div 
            className={`
              relative flex flex-col items-center justify-center w-full h-72 border-2 border-dashed rounded-2xl transition-all duration-300 ease-in-out group
              ${dragActive ? "border-red-500 bg-red-50 scale-[1.02]" : "border-stone-200 bg-stone-50/50"}
              ${uploading ? "opacity-50 pointer-events-none" : "hover:border-red-400 hover:bg-white"}
            `}
            onDragEnter={handleDrag} 
            onDragLeave={handleDrag} 
            onDragOver={handleDrag} 
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              accept=".pdf,.xlsx,.xls,.csv"
              onChange={handleChange}
              disabled={uploading}
            />
            
            <div className="flex flex-col items-center text-center p-6 space-y-5">
              <div className={`p-5 rounded-full transition-colors duration-300 ${dragActive ? 'bg-red-100' : 'bg-white shadow-sm group-hover:bg-red-50'}`}>
                {dragActive ? (
                  <UploadCloud className="w-10 h-10 text-red-500" />
                ) : (
                  <div className="flex space-x-2">
                    <FileText className="w-8 h-8 text-red-400" />
                    <FileSpreadsheet className="w-8 h-8 text-green-500" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-xl font-medium text-stone-700">
                  {dragActive ? "松开手指上传" : "点击或拖拽文件到这里"}
                </p>
                <p className="text-sm text-stone-400 mt-2">支持 PDF, Excel (最大 20MB)</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-5 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center animate-pulse">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              {error}
            </div>
          )}

          {uploading && (
            <div className="mt-8 space-y-3">
              <div className="flex justify-between text-sm font-medium text-stone-600">
                <span className="flex items-center text-red-500">
                  <UploadCloud className="w-4 h-4 mr-2" />
                  正在上传文件...
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-red-500 h-3 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(239,68,68,0.5)]" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-10">
           <div className="flex flex-wrap justify-center gap-6 text-stone-500 text-sm">
             <span className="flex items-center bg-white/50 px-3 py-1.5 rounded-full shadow-sm border border-white/60">
                <Zap className="w-4 h-4 mr-2 text-yellow-500" /> 极速预览
             </span>
             <span className="flex items-center bg-white/50 px-3 py-1.5 rounded-full shadow-sm border border-white/60">
                <Smartphone className="w-4 h-4 mr-2 text-blue-500" /> 移动端适配
             </span>
             <span className="flex items-center bg-white/50 px-3 py-1.5 rounded-full shadow-sm border border-white/60">
                <ShieldCheck className="w-4 h-4 mr-2 text-green-500" /> 安全存储
             </span>
           </div>
        </div>
      </div>
    </div>
  );
};