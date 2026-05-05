import React from 'react';
import { ShoppingCart, Star } from 'lucide-react';

const TOYS = [
  { id: 1, name: 'Кібер Ведмедик', price: 49.99, model: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb', rating: 4.8 },
  { id: 2, name: 'Неоновий Робот', price: 75.00, model: 'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb', rating: 4.9 },
  { id: 3, name: 'Зоряний Вояджер', price: 59.99, model: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb', rating: 4.7 },
  { id: 4, name: 'Меха Рекс', price: 120.00, model: 'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb', rating: 5.0 },
];

export default function Storefront({ addToCart }) {
  return (
    <div className="storefront px-4 py-6">
      <h2 className="text-2xl font-bold mb-6 title-gradient">Ексклюзивні Іграшки</h2>
      <div className="grid grid-cols-1 gap-6">
        {TOYS.map((toy) => (
          <div key={toy.id} className="glass-card p-4 flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-4 right-4 bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
              <Star size={12} fill="currentColor" /> {toy.rating}
            </div>
            
            <div className="h-48 w-full">
               <model-viewer
                src={toy.model}
                alt={toy.name}
                auto-rotate
                camera-controls
                touch-action="pan-y"
                shadow-intensity="1"
                environment-image="neutral"
              ></model-viewer>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-lg font-bold">{toy.name}</h3>
                <p className="text-2xl font-bold text-white">${toy.price}</p>
              </div>
              <button 
                onClick={() => addToCart(toy)}
                className="glass-button flex items-center gap-2"
              >
                <ShoppingCart size={18} />
                Додати
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
