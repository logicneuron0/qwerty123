// Room definitions
export const roomsData = [
  {
    name: 'The Entrance Hall',
    background: '/assets/bg.jpg',
    objects: ['Cross', 'Candlestick', 'Oil Lamp'],
    fakeObjects: ['Vase', 'Rake', 'Telepfone', 'Old frame', 'Bulb1', 'Bulb2'],
    doorPosition: { x: 0, y: -50, z: -250 },
    doorRotation: { x: 0, y: 0, z: 0 }
  },
  {
    name: 'The Living Room',
    background: '/assets/bg8.jpg',
    objects: ['Spider', 'Wig'],
    fakeObjects: ['Group', 'Teapot', 'Wood'],
    doorPosition: { x: 200, y: -80, z: -200 },
    doorRotation: { x: 0, y: -0.5, z: 0 }
  },
  {
    name: 'The Study',
    background: '/assets/bg9.jpg',
    objects: ['Clock', 'Lamp', 'Specs'],
    fakeObjects: ['Bucket', 'Book'],
    doorPosition: { x: -150, y: -60, z: -220 },
    doorRotation: { x: 0, y: 0.3, z: 0 }
  },
  {
    name: 'The Attic',
    background: '/assets/bg4.jpg',
    objects: ['Haunted Painting', 'Hour Glass', 'Key'],
    fakeObjects: ['Old clock'],
    doorPosition: null,
    doorRotation: null
  }
];

// Clue map for riddles
export const clueMap = {
  'Candlestick': 'I shrink as I stand, yet I never move,I weep without sorrow, yet my tears improve.Shadows flee when I whisper my light,What am I, that burns but has no fight',
  'Vase': 'Hollow throat of clay, once sipped the scent of dead flowers.',
  'Rake': 'Iron fingers by the hearth, forever combing ashes for bones.',
  'Telepfone': 'A distant voice entombed in wires, ringing after the caller is gone.',
  'Oil Lamp': 'Once I guided souls through night,Now I whisper without light',
  'Cross': 'Worn on necks or on walls I\'m seen, What am I that protects from the unseen?',
  'Bulb1': 'Glass vessel of forgotten light, once bright now dim in endless night.',
  'Bulb2': 'Hollow sphere that held the glow, now dark where light used to flow.',
  'Horse': 'Silent steed of wood, gallops only in memories.',
  'Spider': 'I believe with great power comes……..I guess we all know it',
  'Group': 'Faces gather but never speak, captured mid-whisper.',
  'Teapot': 'Porcelain throat pours warmth, now cold as the grave.',
  'Wood': 'Splinters of yesterday\'s forest, sleeping by the fire\'s ghost.',
  'Wig': 'If shabby they are called jhaadu(broom),most of us know it as Kala Jaadu(Black Magic)',
  'Clock': 'I\'ve seen them live, I\'ve seen them die. My hands still move, though none can hear,Seek me where the ghosts appear',
  'Bucket': 'A mouth with a metal grin, thirsty for the well\'s secrets.',
  'Book': 'Leather skin and paper bones, whispering learned curses.',
  'Lamp': 'A blind eye on the ceiling, once blinking with light.',
  'Specs': ' Potter stole something from Gandhi, guess what?',
  'Key': 'I became useless when Alohomora entered the castle',
  'Hour Glass': 'time is ticking go find soon once upside down its game over for you',
  'Haunted Painting': 'I hang where silence tends to creep,Eyes that watch while others sleep.',
  'Old clock': 'An elder of ticking halls, hoarding minutes like gold.',
  'Old frame': 'A wooden ring for ghosts, holding what is missing.',
  'Frame': 'Gilded teeth bite the wall, refusing to let go of memories.',
  'Cup': 'A small chalice of warmth, now sipping only dust.',
  'Lock': 'Iron secret-keeper, smiling without a key.'
};

// Item definitions with positions and properties
export const itemsData = [
  { name: 'Candlestick', image: '/assets/items/candlestick.png', geometry: [86, 121], position: [-170, -7, 230], rotation: [0, -3, -0.05], scale: [0.6, 0.45, 0.6] },
  { name: 'Vase', image: '/assets/items/vase.png', geometry: [113, 100], position: [-130, -180, 280], rotation: [0.2, -0.15, 0.12], scale: [0.7, 0.8, 0.8] },
  { name: 'Rake', image: '/assets/items/fireplace_tools.png', geometry: [146, 293], position: [-20, -140, 180], rotation: [0.2, -0.15, 0], scale: [0.3, 0.3, 0.3] },
  { name: 'Telepfone', image: '/assets/items/telepfone.png', geometry: [142, 212], position: [40, -140, 130], rotation: [0.2, 3.2, 0], scale: [0.3, 0.3, 0.3] },
  { name: 'Oil Lamp', image: '/assets/items/oil_lamp.png', geometry: [86, 203], position: [110, -130, 130], rotation: [1.1, 1.4, -0.9], scale: [0.3, 0.3, 0.3] },
  { name: 'Cross', image: '/assets/items/cross.jpg', geometry: [80, 120], position: [-300, -90, 300], rotation: [0.1, -7.5, 0.45], scale: [0.4, 0.4, 0.4] },
  { name: 'Bulb1', image: '/assets/items/bulb1.png', geometry: [60, 80], position: [140, -110, 140], rotation: [1.0, 1.5, -0.8], scale: [0.35, 0.35, 0.35] },
  { name: 'Bulb1', image: '/assets/items/bulb1.png', geometry: [60, 80], position: [-140, 10, 240], rotation: [0.1, -2.8, -0.1], scale: [0.3, 0.3, 0.3] },
  { name: 'Bulb2', image: '/assets/items/bulb2.png', geometry: [60, 80], position: [80, -150, 110], rotation: [1.2, 1.3, -1.0], scale: [0.35, 0.35, 0.35] },
  { name: 'Bulb2', image: '/assets/items/bulb2.png', geometry: [60, 80], position: [-200, -20, 220], rotation: [0.2, -3.1, 0.0], scale: [0.3, 0.3, 0.3] },
  { name: 'Wig', image: '/assets/items/wig.png', geometry: [120, 100], position: [-180, -180, 80], rotation: [-0.2, 1.9, 0.35], scale: [0.5, 0.5, 0.6] },
  { name: 'Spider', image: '/assets/items/spider_web.png', geometry: [92, 65], position: [-320, 75, 70], rotation: [-0.2, 1.9, 0.35], scale: [0.5, 0.5, 0.6] },
  { name: 'Group', image: '/assets/items/group.png', geometry: [175, 157], position: [-190, -80, 5], rotation: [-0.2, 1.5, 0.16], scale: [0.32, 0.32, 0.32] },
  { name: 'Teapot', image: '/assets/items/teapot.png', geometry: [109, 146], position: [-130, -80, -10], rotation: [-0.2, 1.5, 0.16], scale: [0.3, 0.3, 0.3] },
  { name: 'Wood', image: '/assets/items/wood.png', geometry: [395, 197], position: [-210, -205, 230], rotation: [0.9, -3.7, -0.6], scale: [0.3, 0.3, 0.3] },
  { name: 'Clock', image: '/assets/items/clock.png', geometry: [43, 44], position: [-360, -205, 280], rotation: [0.9, -3.7, -0.6], scale: [1, 1, 1] },
  { name: 'Bucket', image: '/assets/items/bucket.png', geometry: [182, 228], position: [200, -210, 30], rotation: [-0.1, -1.5, -0.2], scale: [0.45, 0.5, 0.2] },
  { name: 'Book', image: '/assets/items/book.png', geometry: [135, 53], position: [-300, -120, -240], rotation: [-0.4, 0.4, 0.3], scale: [0.5, 0.5, 0.5] },
  { name: 'Lamp', image: '/assets/items/lamp.png', geometry: [1311, 911], position: [-215, -30, -192], rotation: [-0.3, 0.3, 0.14], scale: [0.07, 0.07, 0.07] },
  { name: 'Specs', image: '/assets/items/brokenspecs.png', geometry: [115, 118], position: [420, -225, -200], rotation: [0, -0.7, 0], scale: [1, 1, 1] },
  { name: 'Key', image: '/assets/items/key.png', geometry: [30, 30], position: [110, 100, -190], rotation: [0, 0, 0], scale: [1, 1, 1] },
  { name: 'Hour Glass', image: '/assets/items/ball.png', geometry: [60, 60], position: [180, -180, 220], rotation: [0.3, 0.7, 0], scale: [1.5, 1.5, 1.5] },
  { name: 'Haunted Painting', image: '/assets/items/painting.jpg', geometry: [461, 345], position: [-90, -3, -190], rotation: [0, -0.5, -0.01], scale: [0.1, 0.1, 0.1] },
  { name: 'Old clock', image: '/assets/items/clock_old.png', geometry: [40, 40], position: [105, -35, -210], rotation: [0, -0.2, 0], scale: [1, 1, 1] },
  { name: 'Old frame', image: '/assets/items/stew.png', geometry: [40, 40], position: [250, -40, -200], rotation: [0, -0.2, 0], scale: [1, 1, 1] }
];
