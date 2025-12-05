import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UploadView } from './views/UploadView';
import { PdfView } from './views/PdfView';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<UploadView />} />
        <Route path="/view/:id" element={<PdfView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;