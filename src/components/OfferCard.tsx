import React from 'react';
import { OfferSettings } from '../types';

interface OfferCardProps {
  settings: OfferSettings;
}

const OfferCard: React.FC<OfferCardProps> = ({ settings }) => {
  const { title, description, imageUrl } = settings;

  if (!title && !description) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-slate-800 dark:via-slate-800 dark:to-purple-900/20 rounded-2xl p-6 shadow-lg dark:shadow-black/20 transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1 border border-purple-100 dark:border-purple-900/50">
      {imageUrl && (
        <div className="mb-4 overflow-hidden rounded-xl ring-2 ring-purple-200 dark:ring-purple-700/50">
          <img src={imageUrl} alt={title || 'Offer Image'} className="w-full h-40 object-cover transform transition-transform duration-500 hover:scale-110" />
        </div>
      )}
      <div className="flex items-center space-x-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"></div>
        <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">{title || 'Offerta Speciale'}</h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
        {description || 'Scopri i dettagli della nostra nuova offerta.'}
      </p>
    </div>
  );
};

export default OfferCard;
