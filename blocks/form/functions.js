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
function startOtpTimer(globals) {
  const timerField = globals.form.otp_verification.timer;
  const resendBtn = globals.form.otp_verification.resend_otp;
  const submitBtn = globals.form.otp_verification.otp_submit; // ✅ correct key

  let seconds = 10;

  if (!timerField) {
    return '';
  }

  window.otpTimerExpired = false;

  updateAttemptsInfo(globals);
  stopOtpTimer(globals);

  if (resendBtn) {
    globals.functions.setProperty(resendBtn, {
      visible: false,
      enabled: false,
    });
  }

  // ✅ enable submit when timer starts
  if (submitBtn) {
    globals.functions.setProperty(submitBtn, {
      enabled: true,
    });
  }

  globals.functions.setProperty(timerField, {
    value: '00:10',
  });

  window.otpTimerInterval = setInterval(() => {
    seconds -= 1;

    if (seconds >= 0) {
      globals.functions.setProperty(timerField, {
        value: `00:${seconds < 10 ? `0${seconds}` : seconds}`,
      });
    }

    if (seconds <= 0) {
      stopOtpTimer(globals);
      window.otpTimerExpired = true;

      globals.functions.setProperty(timerField, {
        value: '00:00',
      });

      updateAttemptsInfo(globals);

      // ✅ disable submit on expiry
      if (submitBtn) {
        globals.functions.setProperty(submitBtn, {
          enabled: false,
        });
      }

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
 * @param {scope} globals
 * @returns {string}
 */
function handleResendOtp(globals) {
  const resendBtn = globals.form.otp_verification.resend_otp;
  const submitBtn = globals.form.otp_verification.otp_submit;

  if (typeof window.otpResendAttemptsLeft !== 'number') {
    window.otpResendAttemptsLeft = 3;
  }

  if (window.otpResendAttemptsLeft > 0) {
    window.otpResendAttemptsLeft -= 1;
  }

  window.otpTimerExpired = false;

  updateAttemptsInfo(globals);

  if (window.otpResendAttemptsLeft <= 0) {
    stopOtpTimer(globals);

    if (resendBtn) {
      globals.functions.setProperty(resendBtn, {
        visible: false,
        enabled: false,
      });
    }

    if (submitBtn) {
      globals.functions.setProperty(submitBtn, {
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

  // ✅ enable submit again on resend
  if (submitBtn) {
    globals.functions.setProperty(submitBtn, {
      enabled: true,
    });
  }

  startOtpTimer(globals);

  return '';
}

/**
 * @param {scope} globals
 * @returns {string}
 */
function handleOtpSuccess(globals) {
  const timerField = globals.form.otp_verification.timer;
  const resendBtn = globals.form.otp_verification.resend_otp;
  const submitBtn = globals.form.otp_verification.otp_submit;
  stopOtpTimer(globals);
  window.otpResendAttemptsLeft = 3;
  window.otpTimerExpired = false;
  updateAttemptsInfo(globals);
  if (resendBtn) {
    globals.functions.setProperty(resendBtn, {
      visible: false,
      enabled: false,
    });
  }
  if (submitBtn) {
    globals.functions.setProperty(submitBtn, {
      enabled: true,
    });
  }
  return 'OTP validated successfully';
}

/**
 * @param {scope} globals
 */
function handleOtpInvalid(globals) {
  setTimeout(() => {
    const resendBtn = globals.form.otp_verification.resend_otp;
    const submitBtn = globals.form.otp_verification.otp_submit;
    const timerField = globals.form.otp_verification.timer;

    stopOtpTimer(globals);

    if (window.otpResendAttemptsLeft > 0) {
      window.otpResendAttemptsLeft -= 1;
    }

    window.otpTimerExpired = false;
    updateAttemptsInfo(globals);

    if (resendBtn) {
      globals.functions.setProperty(resendBtn, {
        visible: true,
        enabled: true,
      });
    }

    if (submitBtn) {
      globals.functions.setProperty(submitBtn, {
        enabled: false,
      });
    }
  }, 100);

  return 'Invalid OTP';
}

/**
 * @param {scope} globals
 * @returns {string}
 */
function calculateEMI(globals) {
  const loanTicks = [50000, 200000, 400000, 600000, 800000, 1000000, 1500000];
  const tenureTicks = [12, 24, 36, 48, 60, 72, 84];

  function getActualValueFromSlider(sliderValue, ticks) {
    const value = Number(sliderValue);

    const lowerIndex = Math.floor(value);
    const upperIndex = Math.ceil(value);

    if (lowerIndex === upperIndex) {
      return ticks[lowerIndex];
    }

    const lowerValue = ticks[lowerIndex];
    const upperValue = ticks[upperIndex];
    const percentage = value - lowerIndex;

    return lowerValue + ((upperValue - lowerValue) * percentage);
  }

  const loanRaw = Number(globals.form.offer.loanamt.valueOf()) || 0;
  const tenureRaw = Number(globals.form.offer.loantenure.valueOf()) || 0;

  const existing = globals.form.$properties || {};

  const savedLoanRaw = loanRaw > 0 ? loanRaw : Number(existing.loanRaw || 0);
  const savedTenureRaw = tenureRaw > 0 ? tenureRaw : Number(existing.tenureRaw || 0);

  globals.functions.setProperty(globals.form, {
    properties: {
    ...existing,
    loanRaw: savedLoanRaw,
    tenureRaw: savedTenureRaw,
    },
  });
  if (!savedLoanRaw || !savedTenureRaw) {
    return '';
  }

  const loanAmt =
    Math.round(getActualValueFromSlider(savedLoanRaw, loanTicks) / 1000) * 1000;

  const tenure = Math.round(
    getActualValueFromSlider(savedTenureRaw, tenureTicks)
  );

  const annualRate = 10.09;
  const monthlyRate = annualRate / 12 / 100;

  const factor = Math.pow(1 + monthlyRate, tenure);

  const emi = Math.round(
    (loanAmt * monthlyRate * factor) / (factor - 1)
  );

  const formattedLoan =
    "₹" + Number(loanAmt).toLocaleString("en-IN");

  globals.functions.setProperty(globals.form.display.loandisplay, {
    value: formattedLoan,
  });

  globals.functions.setProperty(globals.form.display.emi, {
    value: emi,
  });

  globals.functions.setProperty(globals.form.display.rate, {
    value: annualRate,
  });

  globals.functions.setProperty(globals.form.display.tenure, {
    value: 4000,
  });

  return '';
}

/**
 * @param {scope} globals
 * @returns {string}
 */
function setReviewEmi(globals) {
  return globals.form.display.emi.valueOf() || '';
}

/** 
 * @param {scope} globals
 */
function setReviewTenure(globals) {
  return String(globals.form.$properties.tenureRaw || '');
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
  getFullName, days, submitFormArrayToString, maskMobileNumber, startOtpTimer, stopOtpTimer, handleResendOtp, handleOtpSuccess, handleOtpInvalid, calculateEMI, setReviewTenure,setReviewEmi, debugForm,
};
 