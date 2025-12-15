import React, { useState } from 'react';
import AuthPage from './AuthPage';

const App: React.FC = () => {
  return (
    <div className="flex-grow w-full flex bg-gray-100 p-6">
      <div className="w-full flexitems-start justify-center">
        <AuthPage />
      </div>
    </div>
  );
};

export default App;