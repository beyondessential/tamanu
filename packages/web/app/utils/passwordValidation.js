export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL_CHAR: true,
};

export const SPECIAL_CHARACTERS = '!@#$%^&*(),.?":{}|<>';

export const validatePasswordStrength = (password) => {
  if (!password) return { isValid: false, score: 0, issues: [] };

  const issues = [];
  let score = 0;

  // Length check
  if (password.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
    issues.push(`Must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters long`);
  } else {
    score += 1;
  }

  // Uppercase check
  if (PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    issues.push('Must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  // Lowercase check
  if (PASSWORD_REQUIREMENTS.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    issues.push('Must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  // Number check
  if (PASSWORD_REQUIREMENTS.REQUIRE_NUMBER && !/\d/.test(password)) {
    issues.push('Must contain at least one number');
  } else {
    score += 1;
  }

  // Special character check
  if (PASSWORD_REQUIREMENTS.REQUIRE_SPECIAL_CHAR && !new RegExp(`[${SPECIAL_CHARACTERS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password)) {
    issues.push('Must contain at least one special character');
  } else {
    score += 1;
  }

  const isValid = issues.length === 0;
  
  return {
    isValid,
    score,
    issues,
    strength: getPasswordStrengthLevel(score, password.length),
  };
};

export const getPasswordStrengthLevel = (score, length) => {
  if (score < 3 || length < PASSWORD_REQUIREMENTS.MIN_LENGTH) return 'weak';
  if (score < 5) return 'medium';
  return 'strong';
};

export const getPasswordStrengthColor = (strength) => {
  switch (strength) {
    case 'weak': return '#c62828';
    case 'medium': return '#ef6c00';
    case 'strong': return '#2e7d32';
    default: return '#666';
  }
};

export const getPasswordStrengthText = (strength) => {
  switch (strength) {
    case 'weak': return 'Weak password';
    case 'medium': return 'Medium strength password';
    case 'strong': return 'Strong password';
    default: return '';
  }
};

export const formatPasswordRequirements = () => {
  const requirements = [];
  
  requirements.push(`At least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters long`);
  
  if (PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE) {
    requirements.push('Include uppercase letters (A-Z)');
  }
  
  if (PASSWORD_REQUIREMENTS.REQUIRE_LOWERCASE) {
    requirements.push('Include lowercase letters (a-z)');
  }
  
  if (PASSWORD_REQUIREMENTS.REQUIRE_NUMBER) {
    requirements.push('Include at least one number (0-9)');
  }
  
  if (PASSWORD_REQUIREMENTS.REQUIRE_SPECIAL_CHAR) {
    requirements.push('Include at least one special character');
  }
  
  return requirements;
};