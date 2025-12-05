import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, ArrowLeft, ExternalLink, Copy, Check, FileText, Loader2, AlertTriangle, FileSpreadsheet, Link as LinkIcon } from 'lucide-react';
import { getFileInfo } from '../services/leancloudService';
import { UploadedFile } from '../types';
import { Button } from '../components/Button';

export const PdfView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>('');

  useEffect(() => {
    const fetchFile = async () => {
      if (!id) return;
      setLoading(true);
      setErrorDetails('');
      const data = await getFileInfo(id);
      if (!data) {
        setErrorDetails('无法获取文件信息，可能是ID无效或已被删除。');
      }
      setFile(data);
      setLoading(false);
    };
    fetchFile();
  }, [id]);

  // Ensure we always use HTTPS
  const secureUrl = file?.url ? file.url.replace(/^http:\/\//, 'https://') : '';

  const handleCopyDownloadLink = async () => {
    if (!secureUrl) return;

    let success = false;

    // 尝试方案 A: 现代 Clipboard API
    // 注意：在 iframe 中通常需要父级设置 allow="clipboard-write"
    try {
      await navigator.clipboard.writeText(secureUrl);
      success = true;
    } catch (err) {
      console.warn("Clipboard API failed (likely iframe permission issue), trying fallback...", err);
      
      // 尝试方案 B: 传统 execCommand (兼容性更好，通常不需要特定 iframe 权限)
      try {
        const textArea = document.createElement("textarea");
        textArea.value = secureUrl;
        
        // 确保元素不可见但存在于 DOM 中，且位置固定避免滚动页面
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        
        textArea.focus();
        textArea.select();
        
        // 执行旧版复制命令
        success = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (e) {
        console.error("Fallback copy failed:", e);
      }
    }

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } else {
      // 方案 C: 彻底失败时 (极少数严格的安全环境)，弹窗让用户手动复制
      window.prompt("由于浏览器安全限制，请手动复制以下链接：", secureUrl);
    }
  };

  // Determine file type and viewer URL
  const isExcel = file ? /\.(xlsx|xls|csv)$/i.test(file.name) : false;
  
  // Use Microsoft Office Online Viewer for Excel files
  const viewerUrl = isExcel 
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(secureUrl)}`
    : secureUrl;

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#FFF4F0]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full animate-spin"></div>
          <p className="text-stone-500 font-medium">正在读取文件...</p>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#FFF4F0] p-4">
        <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-xl shadow-red-100 border border-red-50">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
             <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-stone-800 mb-2">文件未找到</h2>
          <p className="text-stone-500 mb-6">
            您访问的文件可能已被删除，或者链接有误。<br/>
            <span className="text-xs text-red-300 mt-2 block">{errorDetails}</span>
          </p>
          <Link to="/">
            <Button variant="primary" icon={<ArrowLeft className="w-4 h-4"/>}>
              上传新文件
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-stone-100 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-red-100 shadow-sm z-10 flex-none h-16">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/" className="text-stone-500 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex flex-col">
              <h1 className="text-sm font-bold text-stone-800 truncate max-w-[150px] sm:max-w-md flex items-center" title={file.name}>
                {isExcel ? (
                  <FileSpreadsheet className="w-4 h-4 mr-1 text-green-600 inline" />
                ) : (
                  <FileText className="w-4 h-4 mr-1 text-red-500 inline" />
                )}
                {file.name}
              </h1>
              <span className="text-xs text-stone-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB • {file.createdAt.toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Copy Download Link Button */}
            <Button 
              variant="primary" 
              onClick={handleCopyDownloadLink}
              icon={copied ? <Check className="w-4 h-4 text-white"/> : <LinkIcon className="w-4 h-4"/>}
            >
              {copied ? '已复制，可直接发给商家' : '复制下载链接'}
            </Button>

            {/* Direct Download Icon Button */}
            <a href={secureUrl} download={file.name} target="_blank" rel="noreferrer">
              <Button variant="ghost" className="hidden sm:inline-flex text-stone-500 hover:text-red-600" title="下载原文件">
                <Download className="w-5 h-5" />
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content - Viewer */}
      <main className="flex-1 relative w-full h-full bg-stone-200 flex flex-col items-center justify-center">
        <div className="w-full h-full relative">
           {/* Fallback & Loading Indicator */}
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
             <div className="text-center">
               <Loader2 className="w-8 h-8 text-stone-400 animate-spin mx-auto mb-2" />
               <p className="text-stone-400">正在加载预览...</p>
               {isExcel && <p className="text-stone-400 text-xs mt-2">Excel 预览由 Microsoft 提供</p>}
               {!isExcel && <p className="text-stone-400 text-xs mt-2">如果预览未显示，请尝试点击下方“下载 / 在浏览器打开”</p>}
             </div>
           </div>
           
           {isExcel ? (
             <iframe 
               src={viewerUrl} 
               className="w-full h-full border-none relative z-10 bg-white"
               title="Excel Viewer"
             />
           ) : (
             <object 
               data={viewerUrl} 
               type="application/pdf" 
               className="w-full h-full relative z-10 bg-white"
             >
               <div className="flex items-center justify-center h-full bg-stone-50 text-stone-500 p-8 text-center">
                 <div>
                   <p className="mb-4">您的浏览器暂不支持直接预览此文件。</p>
                   <a href={secureUrl} target="_blank" rel="noreferrer">
                     <Button variant="outline">点击下载查看</Button>
                   </a>
                 </div>
               </div>
             </object>
           )}
        </div>
        
        {/* Mobile Download/Open Hint - Updated logic to handle downloads directly */}
        <div className="sm:hidden absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 w-11/12 max-w-sm">
           <a href={secureUrl} target="_blank" rel="noopener noreferrer">
             <Button variant="secondary" className="w-full shadow-xl shadow-stone-900/10 backdrop-blur-md bg-stone-800/90" icon={<ExternalLink className="w-4 h-4" />}>
               下载 / 在浏览器打开
             </Button>
           </a>
        </div>
      </main>
    </div>
  );
};