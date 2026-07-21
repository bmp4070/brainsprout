import { Link } from 'react-router-dom';
import styles from './GameCard.module.css';
import type { GameMeta } from '../../games/registry';

export interface GameCardProps {
  game: GameMeta;
}

export default function GameCard({ game }: GameCardProps) {
  return (
    <Link to={game.path} className={styles.card}>
      <span className={styles.emoji} aria-hidden="true">
        {game.emoji}
      </span>
      <h2 className={styles.title}>{game.title}</h2>
      <p className={styles.description}>{game.description}</p>
    </Link>
  );
}
