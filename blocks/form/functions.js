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
window.otpErrorCheckInterval = window.otpErrorCheckInterval || null;
window.otpInvalidHandled = window.otpInvalidHandled || false;

window.otpResendAttemptsLeft =
  typeof window.otpResendAttemptsLeft === 'number'
    ? window.otpResendAttemptsLeft
    : 3;

window.otpTimerExpired =
  typeof window.otpTimerExpired === 'boolean'
    ? window.otpTimerExpired
    : false;

/**
 * @param {scope} globals
 * @returns {string}
 */
function updateAttemptsInfo(globals) {
  const attemptsField = globals.form.otp_verification.attempt_info;

  if (!attemptsField) {
    return '';
  }

  if (window.otpTimerExpired) {
    globals.functions.setProperty(attemptsField, {
      value: 'Time expired Retry',
    });
    return '';
  }

  globals.functions.setProperty(attemptsField, {
    value:
      window.otpResendAttemptsLeft > 0
        ? `${window.otpResendAttemptsLeft}/3 attempts left`
        : 'No attempts left',
  });

  return '';
}

/**
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
 * @param {scope} globals
 * @returns {string}
 */
function stopOtpErrorCheck() {
  if (window.otpErrorCheckInterval) {
    clearInterval(window.otpErrorCheckInterval);
    window.otpErrorCheckInterval = null;
  }

  return '';
}

/**
 * Detect invalid OTP automatically
 * @param {scope} globals
 * @returns {string}
 */
function startOtpErrorCheck(globals) {
  const resendBtn = globals.form.otp_verification.resend_otp;

  stopOtpErrorCheck();

  window.otpErrorCheckInterval = setInterval(() => {
    const pageText = document.body ? document.body.innerText : '';

    const hasInvalidOtpMessage =
      pageText.includes('Invalid OTP') ||
      pageText.includes('invalid OTP') ||
      pageText.includes('Invalid otp');

    if (hasInvalidOtpMessage && !window.otpInvalidHandled) {
      window.otpInvalidHandled = true;
      window.otpTimerExpired = false;

      stopOtpTimer(globals);
      stopOtpErrorCheck();

      if (window.otpResendAttemptsLeft > 0) {
        window.otpResendAttemptsLeft -= 1;
      }

      updateAttemptsInfo(globals);

      if (resendBtn) {
        globals.functions.setProperty(resendBtn, {
          visible: window.otpResendAttemptsLeft > 0,
          enabled: window.otpResendAttemptsLeft > 0,
        });
      }

      if (window.otpResendAttemptsLeft <= 0) {
        alert('Maximum attempts reached');

        if (globals.form.otp_verification) {
          globals.functions.setProperty(globals.form.otp_verification, {
            visible: false,
          });
        }

        if (globals.form.personal_loan_offer) {
          globals.functions.setProperty(globals.form.personal_loan_offer, {
            visible: true,
          });
        }
      }
    }
  }, 300);

  return '';
}

/**
 * Start timer
 * @param {scope} globals
 * @returns {string}
 */
function startOtpTimer(globals) {
  const timerField = globals.form.otp_verification.timer;
  const resendBtn = globals.form.otp_verification.resend_otp;

  let seconds = 10;

  if (!timerField) {
    return '';
  }

  if (typeof window.otpResendAttemptsLeft !== 'number') {
    window.otpResendAttemptsLeft = 3;
  }

  window.otpTimerExpired = false;
  window.otpInvalidHandled = false;

  updateAttemptsInfo(globals);

  stopOtpTimer(globals);
  stopOtpErrorCheck();

  if (resendBtn) {
    globals.functions.setProperty(resendBtn, {
      visible: false,
      enabled: false,
    });
  }

  globals.functions.setProperty(timerField, {
    value: '00:10',
  });

  startOtpErrorCheck(globals);

  window.otpTimerInterval = setInterval(() => {
    seconds -= 1;

    if (seconds >= 0) {
      globals.functions.setProperty(timerField, {
        value: `00:${seconds < 10 ? `0${seconds}` : seconds}`,
      });
    }

    if (seconds <= 0) {
      stopOtpTimer(globals);
      stopOtpErrorCheck();

      window.otpTimerExpired = true;

      globals.functions.setProperty(timerField, {
        value: '00:00',
      });

      updateAttemptsInfo(globals);

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

/**
 * Handle resend
 * @param {scope} globals
 * @returns {string}
 */
function handleResendOtp(globals) {
  const resendBtn = globals.form.otp_verification.resend_otp;

  if (typeof window.otpResendAttemptsLeft !== 'number') {
    window.otpResendAttemptsLeft = 3;
  }

  if (window.otpResendAttemptsLeft > 0) {
    window.otpResendAttemptsLeft -= 1;
  }

  window.otpTimerExpired = false;
  window.otpInvalidHandled = false;

  updateAttemptsInfo(globals);

  if (window.otpResendAttemptsLeft <= 0) {
    stopOtpTimer(globals);
    stopOtpErrorCheck();

    if (resendBtn) {
      globals.functions.setProperty(resendBtn, {
        visible: false,
        enabled: false,
      });
    }

    alert('Maximum attempts reached');

    if (globals.form.otp_verification) {
      globals.functions.setProperty(globals.form.otp_verification, {
        visible: false,
      });
    }

    if (globals.form.personal_loan_offer) {
      globals.functions.setProperty(globals.form.personal_loan_offer, {
        visible: true,
      });
    }

    return '';
  }

  if (resendBtn) {
    globals.functions.setProperty(resendBtn, {
      visible: false,
      enabled: false,
    });
  }

  startOtpTimer(globals);

  return '';
}

/**
 * Call when OTP is verified successfully
 * @param {scope} globals
 * @returns {string}
 */
function handleOtpSuccess(globals) {
  const timerField = globals.form.otp_verification.timer;
  const resendBtn = globals.form.otp_verification.resend_otp;

  stopOtpTimer(globals);
  stopOtpErrorCheck();

  window.otpResendAttemptsLeft = 3;
  window.otpTimerExpired = false;
  window.otpInvalidHandled = false;

  updateAttemptsInfo(globals);

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
  getFullName, days, submitFormArrayToString, maskMobileNumber, startOtpTimer, stopOtpTimer, handleResendOtp, handleOtpSuccess, debugForm,
};
 