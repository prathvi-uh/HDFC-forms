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
window.otpResendAttemptsLeft =
  typeof window.otpResendAttemptsLeft === 'number'
    ? window.otpResendAttemptsLeft
    : 3;
window.otpResendInProgress = window.otpResendInProgress || false;

function updateAttemptsInfo(globals) {
  const attemptsField = globals.form.otp_verification.attempts;

  if (!attemptsField) {
    return '';
  }

  globals.functions.setProperty(attemptsField, {
    value:
      window.otpResendAttemptsLeft > 0
        ? `${window.otpResendAttemptsLeft}/3`
        : 'No attempts left',
  });

  return '';
}

function resetOtpValidationMessage(globals) {
  const validationMessage = globals.form.otp_verification.validation_message;

  if (!validationMessage) {
    return '';
  }

  globals.functions.setProperty(validationMessage, {
    value: '',
    visible: false,
  });

  return '';
}

function showOtpValidationMessage(globals, msg) {
  const validationMessage = globals.form.otp_verification.validation_message;

  if (!validationMessage) {
    return '';
  }

  globals.functions.setProperty(validationMessage, {
    value: '',
    visible: false,
  });

  setTimeout(() => {
    globals.functions.setProperty(validationMessage, {
      value: msg || 'Invalid OTP',
      visible: true,
    });
  }, 50);

  return '';
}

function startOtpTimer(globals) {
  const timerField = globals.form.otp_verification.resendOTP;
  const resendBtn = globals.form.otp_verification.resendOTP_btn;

  let seconds = 30;

  if (!timerField) {
    return '';
  }

  updateAttemptsInfo(globals);

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

    if (seconds >= 0) {
      globals.functions.setProperty(timerField, {
        value: `00:${seconds < 10 ? `0${seconds}` : seconds}`,
      });
    }

    if (seconds <= 0) {
      clearInterval(window.otpTimerInterval);
      window.otpTimerInterval = null;

      globals.functions.setProperty(timerField, {
        value: '00:00',
      });

      if (resendBtn && window.otpResendAttemptsLeft > 0) {
        globals.functions.setProperty(resendBtn, {
          visible: true,
          enabled: true,
        });
      }
    }
  }, 1000);

  return '';
}

function stopOtpTimer() {
  if (window.otpTimerInterval) {
    clearInterval(window.otpTimerInterval);
    window.otpTimerInterval = null;
  }

  return '';
}

function handleResendOtp(globals) {
  const resendBtn = globals.form.otp_verification.resendOTP_btn;
  const otpField = globals.form.otp_verification.otp_Value;
  const submitBtn = globals.form.otp_verification.submit_otp;

  if (window.otpResendInProgress) {
    return '';
  }

  window.otpResendInProgress = true;

  resetOtpValidationMessage(globals);

  if (otpField) {
    globals.functions.setProperty(otpField, {
      value: '',
    });
  }

  if (submitBtn) {
    globals.functions.setProperty(submitBtn, {
      enabled: true,
    });
  }

  if (resendBtn) {
    globals.functions.setProperty(resendBtn, {
      visible: false,
      enabled: false,
    });
  }

  if (window.otpResendAttemptsLeft > 0) {
    window.otpResendAttemptsLeft -= 1;
  }

  updateAttemptsInfo(globals);
  startOtpTimer(globals);

  setTimeout(() => {
    window.otpResendInProgress = false;
  }, 500);

  return '';
}

function handleOtpInvalid(globals) {
  const submitBtn = globals.form.otp_verification.submit_otp;
  const resendBtn = globals.form.otp_verification.resendOTP_btn;
  const otpField = globals.form.otp_verification.otp_Value;

  showOtpValidationMessage(globals, 'Invalid OTP');

  if (typeof window.otpResendAttemptsLeft !== 'number') {
    window.otpResendAttemptsLeft = 3;
  }

  if (window.otpResendAttemptsLeft > 0) {
    window.otpResendAttemptsLeft -= 1;
  }

  updateAttemptsInfo(globals);

  if (submitBtn) {
    globals.functions.setProperty(submitBtn, {
      enabled: true,
    });
  }

  if (resendBtn) {
    globals.functions.setProperty(resendBtn, {
      enabled: false,
    });
  }

  if (otpField) {
    globals.functions.setProperty(otpField, {
      value: '',
    });
  }

  if (window.otpResendAttemptsLeft <= 0) {
    const attemptsField = globals.form.otp_verification.attempts;

    if (attemptsField) {
      globals.functions.setProperty(attemptsField, {
        value: 'No attempts left',
      });
    }

    setTimeout(() => {
      resetOtpFlow(globals);
    }, 1500);
  }

  return '';
}

function handleOtpValidated(globals) {
  const timerField = globals.form.otp_verification.resendOTP;
  const resendBtn = globals.form.otp_verification.resendOTP_btn;
  const attemptsField = globals.form.otp_verification.attempts;
  const otpField = globals.form.otp_verification.otp_Value;

  stopOtpTimer();

  window.otpResendAttemptsLeft = 3;
  window.otpResendInProgress = false;

  resetOtpValidationMessage(globals);

  if (timerField) {
    globals.functions.setProperty(timerField, {
      value: '',
    });
  }

  if (resendBtn) {
    globals.functions.setProperty(resendBtn, {
      visible: false,
      enabled: false,
    });
  }

  if (attemptsField) {
    globals.functions.setProperty(attemptsField, {
      value: '',
    });
  }

  if (otpField) {
    globals.functions.setProperty(otpField, {
      value: '',
    });
  }

  return '';
}

/**
 * @param {scope} globals
 */
function debugForm(globals) {
  window.myForm = globals.form;
  // eslint-disable-next-line no-console
  console.log('myForm', window.myForm);
  return '';
}

// eslint-disable-next-line import/prefer-default-export
export {
  getFullName, days, submitFormArrayToString, maskMobileNumber, startOtpTimer, stopOtpTimer, handleResendOtp, handleOtpInvalid, handleOtpValidated,
   debugForm,
};
