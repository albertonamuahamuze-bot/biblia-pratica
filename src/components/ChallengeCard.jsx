
import React from 'react';

export function ChallengeCard({ challenge }) {
  if (!challenge) return null;

  return (
    <div className="card-desafio">
      <div className="card-title text-foreground">Desafio de Hoje</div>
      <div className="card-text text-foreground font-medium">
        {challenge.split('\n').map((paragraph, index) => paragraph.trim() && (
          <p key={index} className="m-0 mb-4 last:mb-0">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
