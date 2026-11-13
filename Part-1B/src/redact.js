const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_CANDIDATE_PATTERN = /(?<![\w])\(?\+?\d[\d\s().-]{5,}\d\)?(?!\w)/g;

// FR-003, FR-014.
function redactText(text) {
  const withoutEmails = text.replace(EMAIL_PATTERN, '[EMAIL]');
  return withoutEmails.replace(PHONE_CANDIDATE_PATTERN, (candidate) => {
    const digits = candidate.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15 ? '[PHONE]' : candidate;
  });
}

// FR-003, FR-014.
function redactComments(comments) {
  return comments.map(({ id, text }) => ({ id, text: redactText(text) }));
}

module.exports = { redactText, redactComments };
