/**
 * The catalogue of collectible items shown in the memory game. Each item is a
 * single emoji on a tile — instantly recognizable, always crisp, and there are
 * far more than any one round needs so studied items and belt distractors are
 * always drawn from a big, varied pool. `id` is a stable kebab-case key used in
 * seeded generation and as a React key; `name` is the accessible label.
 */
export interface Item {
  id: string;
  emoji: string;
  name: string;
}

export const ITEMS: Item[] = [
  { id: 'shell', emoji: '🐚', name: 'sea shell' },
  { id: 'hook', emoji: '🪝', name: 'fishing hook' },
  { id: 'gem', emoji: '💎', name: 'gem' },
  { id: 'key', emoji: '🔑', name: 'key' },
  { id: 'coin', emoji: '🪙', name: 'coin' },
  { id: 'dice', emoji: '🎲', name: 'dice' },
  { id: 'bell', emoji: '🔔', name: 'bell' },
  { id: 'anchor', emoji: '⚓', name: 'anchor' },
  { id: 'star', emoji: '🌟', name: 'star' },
  { id: 'clover', emoji: '🍀', name: 'clover' },
  { id: 'compass', emoji: '🧭', name: 'compass' },
  { id: 'clock', emoji: '⏰', name: 'clock' },
  { id: 'camera', emoji: '📷', name: 'camera' },
  { id: 'robot', emoji: '🤖', name: 'robot' },
  { id: 'rocket', emoji: '🚀', name: 'rocket' },
  { id: 'car', emoji: '🚗', name: 'car' },
  { id: 'plane', emoji: '✈️', name: 'airplane' },
  { id: 'balloon', emoji: '🎈', name: 'balloon' },
  { id: 'kite', emoji: '🪁', name: 'kite' },
  { id: 'boat', emoji: '⛵', name: 'sailboat' },
  { id: 'gift', emoji: '🎁', name: 'gift' },
  { id: 'lollipop', emoji: '🍭', name: 'lollipop' },
  { id: 'candy', emoji: '🍬', name: 'candy' },
  { id: 'apple', emoji: '🍎', name: 'apple' },
  { id: 'cherries', emoji: '🍒', name: 'cherries' },
  { id: 'mushroom', emoji: '🍄', name: 'mushroom' },
  { id: 'flower', emoji: '🌸', name: 'flower' },
  { id: 'ladybug', emoji: '🐞', name: 'ladybug' },
  { id: 'bee', emoji: '🐝', name: 'bee' },
  { id: 'crab', emoji: '🦀', name: 'crab' },
  { id: 'octopus', emoji: '🐙', name: 'octopus' },
  { id: 'dolphin', emoji: '🐬', name: 'dolphin' },
  { id: 'butterfly', emoji: '🦋', name: 'butterfly' },
  { id: 'rainbow', emoji: '🌈', name: 'rainbow' },
  { id: 'umbrella', emoji: '☂️', name: 'umbrella' },
  { id: 'hat', emoji: '🎩', name: 'top hat' },
  { id: 'glasses', emoji: '👓', name: 'glasses' },
  { id: 'watch', emoji: '⌚', name: 'watch' },
  { id: 'magnet', emoji: '🧲', name: 'magnet' },
  { id: 'flashlight', emoji: '🔦', name: 'flashlight' },
  { id: 'yoyo', emoji: '🪀', name: 'yo-yo' },
  { id: 'teddy', emoji: '🧸', name: 'teddy bear' },
  { id: 'palette', emoji: '🎨', name: 'paint palette' },
  { id: 'pencil', emoji: '✏️', name: 'pencil' },
  { id: 'paperclip', emoji: '📎', name: 'paperclip' },
  { id: 'crystal', emoji: '🔮', name: 'crystal ball' },
  { id: 'basketball', emoji: '🏀', name: 'basketball' },
  { id: 'golfball', emoji: '🥎', name: 'ball' },
  { id: 'trophy', emoji: '🏆', name: 'trophy' },
  { id: 'drum', emoji: '🥁', name: 'drum' },
  { id: 'crown', emoji: '👑', name: 'crown' },
  { id: 'ring', emoji: '💍', name: 'ring' },
  { id: 'guitar', emoji: '🎸', name: 'guitar' },
  { id: 'trumpet', emoji: '🎺', name: 'trumpet' },
  { id: 'bicycle', emoji: '🚲', name: 'bicycle' },
  { id: 'train', emoji: '🚂', name: 'train' },
  { id: 'helicopter', emoji: '🚁', name: 'helicopter' },
  { id: 'tractor', emoji: '🚜', name: 'tractor' },
  { id: 'cactus', emoji: '🌵', name: 'cactus' },
  { id: 'palmtree', emoji: '🌴', name: 'palm tree' },
  { id: 'snowflake', emoji: '❄️', name: 'snowflake' },
  { id: 'sun', emoji: '☀️', name: 'sun' },
  { id: 'moon', emoji: '🌙', name: 'moon' },
  { id: 'fire', emoji: '🔥', name: 'fire' },
  { id: 'snowman', emoji: '⛄', name: 'snowman' },
  { id: 'penguin', emoji: '🐧', name: 'penguin' },
  { id: 'turtle', emoji: '🐢', name: 'turtle' },
  { id: 'frog', emoji: '🐸', name: 'frog' },
  { id: 'fish', emoji: '🐠', name: 'fish' },
  { id: 'whale', emoji: '🐳', name: 'whale' },
  { id: 'snail', emoji: '🐌', name: 'snail' },
  { id: 'banana', emoji: '🍌', name: 'banana' },
  { id: 'strawberry', emoji: '🍓', name: 'strawberry' },
  { id: 'icecream', emoji: '🍦', name: 'ice cream' },
  { id: 'donut', emoji: '🍩', name: 'donut' },
];

export const ITEM_BY_ID: Record<string, Item> = Object.fromEntries(
  ITEMS.map((item) => [item.id, item]),
);

export const ITEM_IDS: string[] = ITEMS.map((item) => item.id);
