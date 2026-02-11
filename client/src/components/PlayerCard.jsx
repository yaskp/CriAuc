import React from 'react';
import { User, Crown } from 'lucide-react';

const PlayerCard = ({ player }) => {
    if (!player) return null;

    return (
        <div className="player-card">
            <div style={{ position: 'relative', display: 'inline-block' }}>
                {player.image ? (
                    <img src={`http://localhost:5000${player.image}`} alt={player.name} className="player-img" />
                ) : (
                    <div className="player-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--card-bg)' }}>
                        <User size={80} color="var(--text-muted)" />
                    </div>
                )}
                {player.is_captain === 1 && (
                    <div style={{ position: 'absolute', top: 0, right: 0, background: 'gold', borderRadius: '50%', padding: '5px' }}>
                        <Crown size={16} color="black" />
                    </div>
                )}
            </div>

            <h3>{player.name}</h3>
            <div style={{ marginTop: '0.5rem' }}>
                <span className={`badge badge-${player.category?.replace(' ', '-')}`}>
                    {player.category}
                </span>
            </div>
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
                Base Price: ₹{(player.base_price / 100000).toFixed(1)}L
            </p>
        </div>
    );
};

export default PlayerCard;
