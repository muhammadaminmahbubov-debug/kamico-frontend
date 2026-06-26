import React from 'react';
import ReactDOM from 'react-dom/client';
import Shop from './Shop';
import Admin from './Admin';

// Если URL содержит /admin — показываем админку, иначе магазин
const isAdmin = window.location.pathname.startsWith('/admin');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  isAdmin ? <Admin /> : <Shop />
);
