
import React from 'react';

export function PrayerCard({ prayer }) {
  if (!prayer) return null;

  const hasAmen = /Amém\.?$/i.test(prayer);
  let cleanPrayer = prayer.replace(/Amém\.?$/i, '').trim();

  let greeting = '';
  const greetingMatch = cleanPrayer.match(/^(Querido Pai,?|Pai,?|Senhor,?)\s*/i);
  if (greetingMatch) {
    greeting = greetingMatch[0].trim();
    cleanPrayer = cleanPrayer.replace(greetingMatch[0], '').trim();
  }

  const blocks = cleanPrayer
    .split(/\n+/)
    .filter(Boolean)
    .map(s => s.trim());

  return (
    <div className="card-oracao mx-auto w-full my-6">
      <div className="card-title-oracao opacity-80">
        ORAÇÃO
      </div>
      
      <div className="card-text-oracao">
        {greeting && (
          <div className="mb-[24px]">
            {greeting}
          </div>
        )}
        
        <div className="space-y-[20px]">
          {blocks.map((block, index) => (
            <p key={index} className="m-0">
              {block}
            </p>
          ))}
        </div>

        {hasAmen && (
          <div className="amen-text mt-[32px] mb-0 font-semibold">
            Amém.
          </div>
        )}
      </div>
    </div>
  );
}
