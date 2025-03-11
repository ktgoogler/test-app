import React from 'react';
import { createRoot } from 'react-dom/client';
import DataValidationApp from './App'; // Adjust the path if needed

const container = document.getElementById('root');
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(<DataValidationApp />);
