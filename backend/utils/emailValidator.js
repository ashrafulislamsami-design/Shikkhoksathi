// backend/utils/emailValidator.js

const DISPOSABLE_DOMAINS = new Set([
  'yopmail.com',
  'tempmail.com',
  'temp-mail.org',
  'tempmailo.com',
  'mailinator.com',
  '10minutemail.com',
  'guerrillamail.com',
  'sharklasers.com',
  'getairmail.com',
  'dispostable.com',
  'trashmail.com',
  'maildrop.cc',
  'dropmail.me',
  'mintemail.com',
  'generator.email',
  'crazymailing.com',
  'mytrashmail.com',
  'fakeinbox.com',
  'inboxkitten.com',
  'mailnesia.com',
  'mailcatch.com',
  'discard.email',
  'tempmail.net',
  'tempmail.dev',
  'tempmail.co'
]);

/**
 * Checks if the email belongs to a disposable or temporary email provider.
 * @param {string} email 
 * @returns {boolean} True if disposable, false otherwise
 */
function isDisposableEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  const domain = email.trim().toLowerCase().split('@')[1];
  if (!domain) return false;
  
  // Direct domain match
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return true;
  }
  
  // Subdomain match (e.g. mail.yopmail.com)
  for (const disposable of DISPOSABLE_DOMAINS) {
    if (domain.endsWith('.' + disposable)) {
      return true;
    }
  }
  
  return false;
}

module.exports = {
  isDisposableEmail
};
