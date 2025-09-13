import React from 'react';

export const Spinner = () => (
  <div className="spinner" aria-label="Loading" />
);

export const ErrorMessage = ({ message }) => (
  <div style={{ color: '#ff6a00', background: '#232323', padding: '1em', borderRadius: 8, margin: '1em 0', textAlign: 'center' }}>
    {message}
  </div>
);
