const badWordsMap = {
  'chutiya': 'cute',
  'chutiyap': 'cuteness',
  'madarchod': 'respect',
  'madar chod': 'respect',
  'bhenchod': 'buddy',
  'bhen chod': 'buddy',
  'gandu': 'good',
  'bhosdike': 'sweetheart',
  'bhosdi ke': 'sweetheart',
  'lodu': 'lovely',
  'loda': 'lovely',
  'chut': 'flower',
  'lund': 'stick',
  'saala': 'friend',
  'saale': 'friend',
  'kamina': 'nice',
  'kamine': 'nice',
  'harami': 'lovely',
  'randi': 'queen',
  'fuck': 'love',
  'fucking': 'loving',
  'bitch': 'star',
  'asshole': 'angel',
  'bastard': 'buddy',
  'dick': 'stick',
  'pussy': 'flower',
  'shit': 'oops',
  'cunt': 'buddy'
};

exports.filterProfanity = (text) => {
  if (!text) return text;
  let filtered = text;
  for (const [bad, good] of Object.entries(badWordsMap)) {
    // Escape regex special chars if any
    const escapedBad = bad.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedBad}\\b`, 'gi');
    filtered = filtered.replace(regex, `[censor:${good}]`);
  }
  return filtered;
};
