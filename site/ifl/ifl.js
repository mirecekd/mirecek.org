// site/ifl/ifl.js
// Each load picks a random query; Google's btnI=1 jumps straight to the first hit.
const queries = [
  'zombo com', 'the useless web', 'pointer pointer', 'hampster dance', 'cat bounce',
  'staggering beauty', 'space jam 1996 website', 'nyan cat', 'google gravity',
  'do a barrel roll', 'zerg rush', 'google underwater', 'koalas to the max',
  'heeeeeey', 'omfg dogs', 'this is sand', 'asteroids google', 'weirdest website',
];
const q = queries[Math.floor(Math.random() * queries.length)];
document.querySelector('a').href = `https://www.google.com/search?q=${encodeURIComponent(q)}&btnI=1`;
