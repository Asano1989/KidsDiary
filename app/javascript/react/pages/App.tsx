import React, { useState } from 'react';
import AuthPage from './AuthPage';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="flex items-start justify-center">
        <AuthPage />
      </div>
    </div>
  );
};

export default App;