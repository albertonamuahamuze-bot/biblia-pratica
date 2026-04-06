
import React from 'react';

export function ApplicationCard({ application }) {
  if (!application) return null;

  return (
    <div className="card-aplicacao">
      <div className="card-title">Aplicação Prática</div>
      <div className="card-text text-foreground">
        {application.split('\n').map((paragraph, index) => paragraph.trim() && (
          <p key={index} className="m-0 mb-4 last:mb-0">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
