const badWordsMap = {
  'chutiya': 'cute',
  'madarchod': 'beauty',
  'madar chod': 'beauty',
  'bhenchod': 'brother',
  'bhen chod': 'brother',
  'gandu': 'genius',
  'bhosdike': 'handsome',
  'bhosdi ke': 'handsome',
  'lodu': 'lovely',
  'chut': 'flower',
  'lund': 'stick',
  'fuck': 'hug',
  'bitch': 'queen',
  'asshole': 'angel'
};

exports.filterProfanity = (text) => {
  if (!text) return text;
  let filtered = text;
  for (const [bad, good] of Object.entries(badWordsMap)) {
    const regex = new RegExp(`\\b${bad}\\b`, 'gi');
    filtered = filtered.replace(regex, good);
  }
  return filtered;
};
