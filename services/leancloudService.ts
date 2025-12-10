import AV from 'leancloud-storage';
import { UploadedFile } from '../types';

// Initialize LeanCloud with the user provided credentials
const APP_ID = "jjnp8qOyNxf5TEJzi6yB8PUW-MdYXbMMI";
const APP_KEY = "p5nvjY3eAN5jcNdWINoJDp82";
const SERVER_URL = "https://jjnp8qoy.api.lncldglobal.com";

// Target file domain requested by user
const TARGET_FILE_DOMAIN = "pdfsharezeph.oss-cn-hangzhou.aliyuncs.com";

// Safer initialization check
if (!AV.applicationId) {
  try {
    AV.init({
      appId: APP_ID,
      appKey: APP_KEY,
      serverURL: SERVER_URL,
    });
  } catch (error) {
    console.error("LeanCloud initialization failed:", error);
  }
}

// Helper to swap domain to the target OSS domain
const enforceTargetDomain = (originalUrl: string | undefined): string => {
  if (!originalUrl) return '';
  try {
    const urlObj = new URL(originalUrl);
    urlObj.hostname = TARGET_FILE_DOMAIN;
    urlObj.protocol = 'https:';
    return urlObj.toString();
  } catch (e) {
    // If URL parsing fails, just return original but try to upgrade protocol
    return originalUrl ? originalUrl.replace(/^http:\/\//, 'https://') : '';
  }
};

// Renamed from uploadPdf to uploadFile for clarity
export const uploadFile = async (
  file: File, 
  onProgress: (percent: number) => void
): Promise<UploadedFile> => {
  const avFile = new AV.File(file.name, file);
  
  try {
    const savedFile = await avFile.save({
      onprogress: (event) => {
        if (event.loaded && event.total) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      }
    });

    // Get original URL and swap domain
    const originalUrl = savedFile.url();
    const fileUrl = enforceTargetDomain(originalUrl);

    // Use 'SharedPDF' table for compatibility, but it now stores Excel too.
    const PDFShare = AV.Object.extend('SharedPDF');
    const fileShare = new PDFShare();
    
    fileShare.set('name', savedFile.get('name'));
    fileShare.set('url', fileUrl); // Save the new URL with custom domain
    fileShare.set('size', savedFile.size());
    fileShare.set('fileId', savedFile.id); 
    // Store mime-type if available, or infer from file
    fileShare.set('mimeType', file.type);

    const acl = new AV.ACL();
    acl.setPublicReadAccess(true); 
    acl.setPublicWriteAccess(false);
    fileShare.setACL(acl);

    const savedShare = await fileShare.save();

    return {
      objectId: savedShare.id!,
      name: savedShare.get('name'),
      url: savedShare.get('url'),
      createdAt: savedShare.createdAt || new Date(),
      size: savedShare.get('size'),
      mimeType: savedShare.get('mimeType')
    };
  } catch (error) {
    console.error("Upload failed:", error);
    throw new Error("上传失败，请检查网络或重试。");
  }
};

// Renamed from getPdfInfo to getFileInfo
export const getFileInfo = async (objectId: string): Promise<UploadedFile | null> => {
  try {
    const query = new AV.Query('SharedPDF');
    const shareObj = await query.get(objectId);
    
    if (!shareObj) return null;

    // Retrieve stored URL
    let storedUrl = shareObj.get('url');
    // Enforce target domain again just in case (e.g. for old records)
    const fileUrl = enforceTargetDomain(storedUrl);

    return {
      objectId: shareObj.id!,
      name: shareObj.get('name'),
      url: fileUrl,
      createdAt: shareObj.createdAt || new Date(),
      size: shareObj.get('size'),
      mimeType: shareObj.get('mimeType')
    };
  } catch (error: any) {
    console.error("Fetch failed:", error);
    if (error.code === 403) {
      console.error("Permission denied. Please check Class permissions in LeanCloud console.");
    }
    return null;
  }
};