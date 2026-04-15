/**
 * Get Full Name
 * @name getFullName Concats first name and last name
 * @param {string} firstname in Stringformat
 * @param {string} lastname in Stringformat
 * @return {string}
 */
function getFullName(firstname, lastname) {
  return `${firstname} ${lastname}`.trim();
}

/**
 * Custom submit function
 * @param {scope} globals
 */
function submitFormArrayToString(globals) {
  const data = globals.functions.exportData();
  Object.keys(data).forEach((key) => {
    if (Array.isArray(data[key])) {
      data[key] = data[key].join(',');
    }
  });
  globals.functions.submitForm(data, true, 'application/json');
}

/**
 * Calculate the number of days between two dates.
 * @param {*} endDate
 * @param {*} startDate
 * @returns {number} returns the number of days between two dates
 */
function days(endDate, startDate) {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  // return zero if dates are valid
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const diffInMs = Math.abs(end.getTime() - start.getTime());
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
}

/**
* Masks the first 5 digits of the mobile number with *
* @param {*} mobileNumber
* @returns {string} returns the mobile number with first 5 digits masked
*/
function maskMobileNumber(mobileNumber) {
  if (!mobileNumber) {
    return '';
  }
  const value = mobileNumber.toString();
  // Mask first 5 digits and keep the rest
  return ` ${'*'.repeat(5)}${value.substring(5)}`;
}

window.otpTimerInterval = window.otpTimerInterval || null;
window.otpResendAttemptsLeft = typeof window.otpResendAttemptsLeft === 'number'
  ? window.otpResendAttemptsLeft
  : 3;

/**
 * Updates attempts text
 * Change path if needed
 * @param {scope} globals
 * @returns {string}
 */
function updateOtpAttemptsInfo(globals) {
  const attemptsField = globals.form.otp_verification.attempts_info;

  if (attemptsField) {
    globals.functions.setProperty(attemptsField, {
      value: `${window.otpResendAttemptsLeft} attempt(s) left`,
    });
  }

  return '';
}

/**
 * Initialize attempts and hide resend button
 * Change paths if needed
 * @param {scope} globals
 * @returns {string}
 */
function initOtpAttempts(globals) {
  const resendBtn = globals.form.otp_verification.resend_otp;

  window.otpResendAttemptsLeft = 3;
  updateOtpAttemptsInfo(globals);

  if (resendBtn) {
    globals.functions.setProperty(resendBtn, {
      visible: false,
      enabled: false,
    });
  }

  return '';
}

/**
 * Start 30-second timer
 * Change paths if needed
 * @param {scope} globals
 * @returns {string}
 */
function startOtpTimer(globals) {
  const timerField = globals.form.otp_verification.timer;
  const resendBtn = globals.form.otp_verification.resend_otp;
  let seconds = 30;

  if (!timerField) {
    return '00:30';
  }

  if (window.otpTimerInterval) {
    clearInterval(window.otpTimerInterval);
    window.otpTimerInterval = null;
  }

  if (resendBtn) {
    globals.functions.setProperty(resendBtn, {
      visible: false,
      enabled: false,
    });
  }

  globals.functions.setProperty(timerField, {
    value: '00:30',
  });

  updateOtpAttemptsInfo(globals);

  window.otpTimerInterval = setInterval(() => {
    seconds -= 1;

    if (seconds >= 10) {
      globals.functions.setProperty(timerField, {
        value: `00:${seconds}`,
      });
    } else if (seconds >= 0) {
      globals.functions.setProperty(timerField, {
        value: `00:0${seconds}`,
      });
    }

    if (seconds <= 0) {
      clearInterval(window.otpTimerInterval);
      window.otpTimerInterval = null;

      globals.functions.setProperty(timerField, {
        value: '00:00',
      });

      if (resendBtn) {
        const canResend = window.otpResendAttemptsLeft > 0;
        globals.functions.setProperty(resendBtn, {
          visible: canResend,
          enabled: canResend,
        });
      }
    }
  }, 1000);

  return '00:30';
}

/**
 * Stop timer only
 * @param {scope} globals
 * @returns {string}
 */
function stopOtpTimer(globals) {
  if (window.otpTimerInterval) {
    clearInterval(window.otpTimerInterval);
    window.otpTimerInterval = null;
  }

  return '';
}

/**
 * Handle resend click:
 * reduce attempts, hide resend button, restart timer
 * Change paths if needed
 * @param {scope} globals
 * @returns {string}
 */
function handleResendOtp(globals) {
  const resendBtn = globals.form.otp_verification.resend_otp;

  if (window.otpResendAttemptsLeft > 0) {
    window.otpResendAttemptsLeft -= 1;
  }

  updateOtpAttemptsInfo(globals);

  if (resendBtn) {
    globals.functions.setProperty(resendBtn, {
      visible: false,
      enabled: false,
    });
  }

  startOtpTimer(globals);

  return '';
}
// eslint-disable-next-line import/prefer-default-export
export {
  getFullName, days, submitFormArrayToString, maskMobileNumber, updateOtpAttemptsInfo, initOtpAttempts, startOtpTimer, stopOtpTimer, handleResendOtp,
};
