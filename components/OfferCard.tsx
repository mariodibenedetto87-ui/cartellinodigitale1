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
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg dark:shadow-black/20 transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
      {imageUrl && (
        <div className="mb-4">
          <img src={imageUrl} alt={title || 'Offer Image'} className="rounded-lg w-full h-40 object-cover" />
        </div>
      )}
      <h3 className="text-lg font-bold text-teal-500 dark:text-teal-400 mb-2">{title || 'Offerta Speciale'}</h3>
      <p className="text-sm text-gray-600 dark:text-slate-300">
        {description || 'Scopri i dettagli della nostra nuova offerta.'}
      </p>
    </div>
  );
};

export default OfferCard;