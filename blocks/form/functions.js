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
  const submitBtn = globals.form.otp_verification.otp_submit;

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

    if (globals.form.otp_verification) {
      globals.functions.setProperty(globals.form.otp_verification, {
        visible: false,
      });
    }

    if (globals.form.zerotry) {
      globals.functions.setProperty(globals.form.zerotry, {
        visible: true,
      });
    }

    if (globals.form.zerotry && globals.form.zerotry.retry) {
      globals.functions.setProperty(globals.form.zerotry.retry, {
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

  function cleanNumber(value) {
    return Number(String(value || '').replace(/[^\d.]/g, '')) || 0;
  }

  function getActualValueFromSlider(sliderValue, ticks) {
    const value = cleanNumber(sliderValue);
    const maxIndex = ticks.length - 1;

    if (value <= 0) return ticks[0];
    if (value >= maxIndex && value <= 100) return ticks[maxIndex];

    if (value > 100) return value;

    const lowerIndex = Math.floor(value);
    const upperIndex = Math.ceil(value);

    if (lowerIndex === upperIndex) return ticks[lowerIndex];

    return ticks[lowerIndex] + ((ticks[upperIndex] - ticks[lowerIndex]) * (value - lowerIndex));
  }

  const existing = globals.form.$properties || {};

  const loanRaw = cleanNumber(globals.form.offer.loanamt.valueOf()) || cleanNumber(existing.loanRaw);
  const tenureRaw = cleanNumber(globals.form.offer.loantenure.valueOf()) || cleanNumber(existing.tenureRaw);

  if (!loanRaw || !tenureRaw) return '';

  const loanAmt = Math.round(getActualValueFromSlider(loanRaw, loanTicks) / 1000) * 1000;
  const tenure = Math.round(getActualValueFromSlider(tenureRaw, tenureTicks));

  const annualRate = 10.09;
  const monthlyRate = annualRate / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenure);
  const emi = Math.round((loanAmt * monthlyRate * factor) / (factor - 1));

  if (!emi || Number.isNaN(emi)) return '';

  const formattedLoan = `₹${Number(loanAmt).toLocaleString('en-IN')}`;
  const formattedTenure = `${tenure} months`;

  globals.functions.setProperty(globals.form, {
    properties: {
      ...(globals.form.$properties || {}),
      loanRaw,
      tenureRaw,
      reviewLoanAmount: formattedLoan,
      reviewEmi: emi,
      reviewTenure: formattedTenure,
    },
  });

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
 */
function restoreReviewLoanDetails(globals) {
  debugger;
  const props = globals.form.$properties || {};
  const loanDetails = globals.form.review?.view_details?.loan_accordion?.loan_details;

  if (!loanDetails) return '';

  globals.functions.setProperty(loanDetails.emiamt, {
    value: props.reviewEmi ? `₹${Number(props.reviewEmi).toLocaleString('en-IN')}` : ''
  });

  globals.functions.setProperty(loanDetails.loantenure, {
    value: props.reviewTenure || '',
  });

  return '';
}

/** 
 * @param {scope} globals
 */
function generateOtp(globals) {
  const form = globals.form;

  const mobile = form.personal_loan_offer.mobile?.$value || '';
  const dob = form.personal_loan_offer.date_of_birth?.$value || '';
  const pan = form.personal_loan_offer.pan?.$value || '';

  console.log('mobile:', mobile);
  console.log('dob:', dob);
  console.log('pan:', pan);

  fetch('https://await-matchbox-certify.ngrok-free.dev/generate-otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    },
    body: JSON.stringify({
      mobile,
      dob,
      pan
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log('API RESPONSE:', data);

    if (data.success) {
      globals.functions.setProperty(form.otp_verification.entered_otp, {
        value: data.otp
      });
    }
  });

  return 'Generating OTP...';
}

/**
 * @param {scope} globals
 */
function starttimer(globals) {
  const form = globals.form;

  let timeLeft = 10;

  // stop previous timer
  if (window.otpTimer) {
    clearInterval(window.otpTimer);
  }

  // ❌ disable resend at start
  globals.functions.setProperty(form.otp_verification.resend_otp, {
    enabled: false,
    visible: true
  });

  globals.functions.setProperty(form.otp_verification.timer, {
    value: `Resend OTP in : ${timeLeft}`
  });

  window.otpTimer = setInterval(() => {
    timeLeft--;

    globals.functions.setProperty(form.otp_verification.timer, {
      value: `Resend OTP in : ${timeLeft}`
    });

    if (timeLeft <= 0) {
      clearInterval(window.otpTimer);

      // ✅ enable resend ONLY now
      globals.functions.setProperty(form.otp_verification.resend_otp, {
        enabled: true,
        visible: true
      });

      globals.functions.setProperty(form.otp_verification.timer, {
        value: 'You can resend OTP now'
      });
    }
  }, 1000);

  return '';
}

/**
 * @param {scope} globals
 */
function starttimer(globals) {
  const form = globals.form;

  let timeLeft = 10;

  // stop previous timer
  if (window.otpTimer) {
    clearInterval(window.otpTimer);
  }

  // ❌ disable resend at start
  globals.functions.setProperty(form.otp_verification.resend_otp, {
    enabled: false,
    visible: true
  });

  globals.functions.setProperty(form.otp_verification.timer, {
    value: `Resend OTP in : ${timeLeft}`
  });

  window.otpTimer = setInterval(() => {
    timeLeft--;

    globals.functions.setProperty(form.otp_verification.timer, {
      value: `Resend OTP in : ${timeLeft}`
    });

    if (timeLeft <= 0) {
      clearInterval(window.otpTimer);

      // ✅ enable resend ONLY now
      globals.functions.setProperty(form.otp_verification.resend_otp, {
        enabled: true,
        visible: true
      });

      globals.functions.setProperty(form.otp_verification.timer, {
        value: 'You can resend OTP now'
      });
    }
  }, 1000);

  return '';
}

/**
 * @param {scope} globals
 */
function stoptimer(globals) {
  const form = globals.form;

  // stop timer
  if (window.otpTimer) {
    clearInterval(window.otpTimer);
  }

  // clear timer text
  globals.functions.setProperty(form.otp_verification.timer, {
    value: ''
  });

  // hide OTP panel
  globals.functions.setProperty(form.otp_verification, {
    visible: false
  });

  // show next panel (CHANGE if needed)
  globals.functions.setProperty(form["e-income"], {
    visible: true
  });

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
  getFullName, days, submitFormArrayToString, maskMobileNumber, startOtpTimer, stopOtpTimer, handleResendOtp, handleOtpSuccess, handleOtpInvalid, calculateEMI, restoreReviewLoanDetails, generateOtp, debugForm,starttimer,stoptimer
};
 