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

// =============================
// GLOBAL TIMER (only timer in window)
// =============================
window.otpTimerInterval = window.otpTimerInterval || null;


// =============================
// HELPER: Update Attempts UI
// =============================
function updateAttemptsInfo(globals) {
  const attemptsField = globals.form.otp_verification.attempt_info;

  let attempts = globals.form.$properties.otpAttempts;

  if (typeof attempts !== 'number') {
    attempts = 3;
    globals.functions.setProperty(globals.form, {
      properties: { otpAttempts: 3 }
    });
  }

  if (attemptsField) {
    globals.functions.setProperty(attemptsField, {
      value: attempts > 0 ? `${attempts}/3` : 'No attempts left',
    });
  }

  return '';
}


// =============================
// START TIMER (30 sec)
// =============================
function startOtpTimer(globals) {
  const timerField = globals.form.otp_verification.timer;
  const resendBtn = globals.form.otp_verification.resend_otp;

  let seconds = 30;

  if (!timerField) return '';

  // initialize attempts if not present
  let attempts = globals.form.$properties.otpAttempts;

  if (typeof attempts !== 'number') {
    attempts = 3;
    globals.functions.setProperty(globals.form, {
      properties: { otpAttempts: 3 }
    });
  }

  updateAttemptsInfo(globals);

  // clear old timer
  if (window.otpTimerInterval) {
    clearInterval(window.otpTimerInterval);
    window.otpTimerInterval = null;
  }

  // hide resend button
  if (resendBtn) {
    globals.functions.setProperty(resendBtn, {
      visible: false,
      enabled: false,
    });
  }

  // set initial timer
  globals.functions.setProperty(timerField, {
    value: '00:30',
  });

  // start countdown
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

      // show resend only if attempts left
      let attempts = globals.form.$properties.otpAttempts || 0;

      if (resendBtn && attempts > 0) {
        globals.functions.setProperty(resendBtn, {
          visible: true,
          enabled: true,
        });
      }
    }
  }, 1000);

  return '';
}


// =============================
// STOP TIMER
// =============================
function stopOtpTimer() {
  if (window.otpTimerInterval) {
    clearInterval(window.otpTimerInterval);
    window.otpTimerInterval = null;
  }
  return '';
}


// =============================
// HANDLE RESEND CLICK
// =============================
function handleResendOtp(globals) {
  const resendBtn = globals.form.otp_verification.resend_otp;

  let attempts = globals.form.$properties.otpAttempts || 3;

  if (attempts > 0) {
    attempts -= 1;
  }

  globals.functions.setProperty(globals.form, {
    properties: { otpAttempts: attempts }
  });

  updateAttemptsInfo(globals);

  if (resendBtn) {
    globals.functions.setProperty(resendBtn, {
      visible: false,
      enabled: false,
    });
  }

  startOtpTimer(globals);

  return '';
}


// =============================
// OTP SUCCESS
// =============================
function handleOtpSuccess(globals) {
  const timerField = globals.form.otp_verification.timer;
  const resendBtn = globals.form.otp_verification.resend_otp;

  stopOtpTimer();

  // reset attempts
  globals.functions.setProperty(globals.form, {
    properties: { otpAttempts: 3 }
  });

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


// =============================
// HANDLE OTP RESPONSE (MAIN)
// =============================
function handleOtpResponse(globals) {
  const msgField = globals.form.otp_verification.validation_message;
  const msg = msgField ? msgField.value : '';

  if (!msg) return '';

  if (msg.toLowerCase().includes("invalid")) {
    return handleInvalidOtp(globals);
  }

  if (msg.toLowerCase().includes("valid")) {
    return handleOtpSuccess(globals);
  }

  return '';
}


// =============================
// INVALID OTP HANDLER
// =============================
function handleInvalidOtp(globals) {
  const timerField = globals.form.otp_verification.timer;
  const resendBtn = globals.form.otp_verification.resend_otp;
  const attemptsField = globals.form.otp_verification.attempt_info;

  stopOtpTimer();

  let attempts = globals.form.$properties.otpAttempts || 3;

  if (attempts > 0) {
    attempts -= 1;
  }

  globals.functions.setProperty(globals.form, {
    properties: { otpAttempts: attempts }
  });

  // update attempts UI
  if (attemptsField) {
    globals.functions.setProperty(attemptsField, {
      value: attempts > 0 ? attempts + "/3" : "No attempts left"
    });
  }

  if (timerField) {
    globals.functions.setProperty(timerField, {
      value: "00:00"
    });
  }

  if (resendBtn) {
    globals.functions.setProperty(resendBtn, {
      visible: attempts > 0,
      enabled: attempts > 0
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
  getFullName, days, submitFormArrayToString, maskMobileNumber, startOtpTimer, stopOtpTimer, handleResendOtp, handleOtpSuccess, handleInvalidOtp,debugForm,
};
