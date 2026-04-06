
import React from 'react';

export function ReflectionCard({ reflection }) {
  if (!reflection) return null;

  return (
    <div className="card-reflexao">
      <div className="card-title text-muted-foreground">Reflexão do Dia</div>
      <div className="card-text text-foreground">
        {reflection.split('\n').map((paragraph, index) => paragraph.trim() && (
          <p key={index} className="m-0 mb-4 last:mb-0">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
