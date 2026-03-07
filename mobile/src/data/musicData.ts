import { Music } from '../types/music';

export const musicLibrary: Music[] = [
  {
    id: '1',
    title: 'Diazepam',
    artist: 'Turnover',
    album: 'Peripheral Vision',
    duration: 201,
    file: require('../../assets/audio/Diazepam.mp3'),
    coverUrl: require('../../assets/images/covers/turnover-peripheral-vision.jpg'), // ✅
    genre: 'Emo/Indie Rock',
    releaseYear: 2015,
  },
  {
    id: '2',
    title: 'Morte a Janeiro',
    artist: 'Yuri e os Terráqueos', 
    album: 'Single',
    duration: 152,
    file: require('../../assets/audio/Morte a Janeiro.mp3'),
    coverUrl: require('../../assets/images/covers/yuri-terraqueos-single.jpg'), // ✅
    genre: 'Rock Alternativo',
    releaseYear: 2024,
  },
  {
    id: '3',
    title: 'Shadows',
    artist: 'Sunny Day Real Estate',
    album: 'Diary',
    duration: 286,
    file: require('../../assets/audio/Shadows.mp3'),
    coverUrl: require('../../assets/images/covers/sunny-day-real-estate-diary.jpg'), // ✅
    genre: 'Emo',
    releaseYear: 1994,
  },
  {
    id: '4',
    title: 'Anaconda Sniper',
    artist: 'Title Fight',
    album: 'Shed',
    duration: 161,
    file: require('../../assets/audio/Anaconda Sniper.mp3'),
    coverUrl: require('../../assets/images/covers/title-fight-shed.jpg'), // ✅
    genre: 'Hardcore Punk',
    releaseYear: 2011,
  },
];

// Função para formatar duração (segundos -> MM:SS)
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Agrupar por artista para a HomeScreen
export const getArtistsWithSongs = () => {
  const artists: { [key: string]: Music[] } = {};
  
  musicLibrary.forEach(music => {
    if (!artists[music.artist]) {
      artists[music.artist] = [];
    }
    artists[music.artist].push(music);
  });
  
  return artists;
};