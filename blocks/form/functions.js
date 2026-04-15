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
window.otpWrongAttempts = typeof window.otpWrongAttempts === 'number' ? window.otpWrongAttempts : 3;

/**
 * Initialize OTP state
 * @param {scope} globals
 * @returns {string}
 */
function initOtpState(globals) {
  const attemptsField = globals.form.otp_verification.attempts_info;
  const resendBtn = globals.form.otp_verification.resend_otp;
  const validateBtn = globals.form.otp_verification.validate_otp;
  const timerField = globals.form.otp_verification.timer;

  window.otpWrongAttempts = 3;

  if (window.otpTimerInterval) {
    clearInterval(window.otpTimerInterval);
    window.otpTimerInterval = null;
  }

  if (attemptsField) {
    globals.functions.setProperty(attemptsField, {
      value: '3 attempts left',
    });
  }

  if (resendBtn) {
    globals.functions.setProperty(resendBtn, {
      visible: false,
      enabled: false,
    });
  }

  if (validateBtn) {
    globals.functions.setProperty(validateBtn, {
      enabled: true,
    });
  }

  if (timerField) {
    globals.functions.setProperty(timerField, {
      value: '',
    });
  }

  return '';
}

/**
 * Start 30 sec timer
 * @param {scope} globals
 * @returns {string}
 */
function startOtpTimer(globals) {
  const timerField = globals.form.otp_verification.timer;
  const resendBtn = globals.form.otp_verification.resend_otp;

  let seconds = 30;

  if (!timerField) {
    return '';
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
        globals.functions.setProperty(resendBtn, {
          visible: true,
          enabled: true,
        });
      }
    }
  }, 1000);

  return '';
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
 * Reduce attempts when wrong OTP entered
 * @param {scope} globals
 * @returns {string}
 */
function reduceWrongOtpAttempts(globals) {
  const attemptsField = globals.form.otp_verification.attempts_info;
  const validateBtn = globals.form.otp_verification.validate_otp;

  if (window.otpWrongAttempts > 0) {
    window.otpWrongAttempts -= 1;
  }

  if (attemptsField) {
    globals.functions.setProperty(attemptsField, {
      value: `${window.otpWrongAttempts} attempts left`,
    });
  }

  if (window.otpWrongAttempts === 0 && validateBtn) {
    globals.functions.setProperty(validateBtn, {
      enabled: false,
    });
  }

  return '';
}

/**
 * Resend OTP helper
 * Hides resend button and restarts timer
 * @param {scope} globals
 * @returns {string}
 */
function handleResendOtp(globals) {
  const resendBtn = globals.form.otp_verification.resend_otp;

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
  getFullName, days, submitFormArrayToString, maskMobileNumber, initOtpState, startOtpTimer, stopOtpTimer,reduceWrongOtpAttempts, handleResendOtp,
};
