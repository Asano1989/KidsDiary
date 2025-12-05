import React from 'react';
import AuthPage from './AuthPage';

const App = () => {
  return (
    <>
      <p className="text-3xl font-bold underline m-4">Sample React (App.jsx)</p>
      <button className="bg-gray-900 hover:bg-gray-800 text-white rounded px-4 py-2 m-4">tailwind</button>
      
      <AuthPage />
    </>
  )
};

export default App;