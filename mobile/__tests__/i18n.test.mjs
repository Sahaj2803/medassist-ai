import en from '../i18n/en.js';
import hi from '../i18n/hi.js';
import gu from '../i18n/gu.js';

describe('I18n Dictionary Parity and Structure', () => {
  const getKeys = (obj, prefix = '') => {
    let keys = [];
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        keys = keys.concat(getKeys(obj[key], `${prefix}${key}.`));
      } else {
        keys.push(`${prefix}${key}`);
      }
    }
    return keys.sort();
  };

  const enKeys = getKeys(en);
  const hiKeys = getKeys(hi);
  const guKeys = getKeys(gu);

  it('Hindi dictionary must have exactly the same keys as English', () => {
    expect(hiKeys).toEqual(enKeys);
  });

  it('Gujarati dictionary must have exactly the same keys as English', () => {
    expect(guKeys).toEqual(enKeys);
  });

  it('English dictionary must contain no empty string values', () => {
    const hasEmpty = Object.values(en).some(val => val === '');
    expect(hasEmpty).toBe(false);
  });
});
