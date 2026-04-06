
import React from 'react';

export function BibleReadingCard({ text }) {
  if (!text) return null;

  return (
    <div className="card-leitura">
      <div className="card-title text-muted-foreground">Leitura Bíblica</div>
      <div className="card-text">
        {text.split('\n').map((paragraph, index) => paragraph.trim() && (
          <p key={index} className="m-0 mb-3 last:mb-0">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
