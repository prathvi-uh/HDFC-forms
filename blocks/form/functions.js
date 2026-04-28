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
  debugger;
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

const rangeConfigs = {
  loanAmount: {
    ticks: [50000, 200000, 400000, 600000, 800000, 1000000, 1500000],
    defaultValue: 1500000,
    formatBubble: (value) => `₹${Number(value).toLocaleString('en-IN')}`,
    formatTick: (value) => (value === 50000 ? '50K' : `${value / 100000}L`),
  },
  loanTenure: {
    ticks: [12, 24, 36, 48, 60, 72, 84],
    defaultValue: 84,
    formatBubble: (value) => `${Math.round(value)} months`,
    formatTick: (value) => `${value}m`,
  },
};
 
function isLoanAmountSlider(input, fieldDiv) {
  const title = fieldDiv.querySelector(
    'label, .field-label, .cmp-adaptiveform-textinput__label, .cmp-adaptiveform-numberinput__label, .cmp-adaptiveform-range__label'
  );
 
  const labelText = title ? title.textContent.toLowerCase() : '';
  return labelText.includes('loan amount');
}
 
function getFieldType(input, fieldDiv) {
  return isLoanAmountSlider(input, fieldDiv) ? 'loanAmount' : 'loanTenure';
}
 
function getSliderValueFromActual(actualValue, config) {
  const ticks = config.ticks;
 
  if (actualValue <= ticks[0]) return 0;
  if (actualValue >= ticks[ticks.length - 1]) return ticks.length - 1;
 
  for (let i = 0; i < ticks.length - 1; i += 1) {
    if (actualValue >= ticks[i] && actualValue <= ticks[i + 1]) {
      return i + ((actualValue - ticks[i]) / (ticks[i + 1] - ticks[i]));
    }
  }
 
  return 0;
}
 
function getActualValueFromSlider(sliderValue, config) {
  const value = Number(sliderValue);
  const lowerIndex = Math.floor(value);
  const upperIndex = Math.ceil(value);
 
  if (lowerIndex === upperIndex) return config.ticks[lowerIndex];
 
  return config.ticks[lowerIndex]
    + ((config.ticks[upperIndex] - config.ticks[lowerIndex]) * (value - lowerIndex));
}
 
function formatActualValue(actualValue, fieldType) {
  if (fieldType === 'loanAmount') {
    return Math.round(actualValue / 1000) * 1000;
  }
 
  if (fieldType === 'loanTenure') {
    return Math.round(actualValue);
  }
 
  return actualValue;
}
 
function createTicks(input, wrapper, config) {
  const ticksWrap = document.createElement('div');
  ticksWrap.className = 'range-ticks';
 
  config.ticks.forEach((tickValue, index) => {
    const tickEl = document.createElement('span');
    tickEl.className = 'range-tick';
    tickEl.textContent = config.formatTick(tickValue);
 
    tickEl.addEventListener('click', () => {
      input.value = index;
      updateBubble(input, wrapper);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
 
    ticksWrap.appendChild(tickEl);
  });
 
  wrapper.appendChild(ticksWrap);
}
 
function updateBubble(input, wrapper) {
  const fieldType = input.dataset.fieldType;
  const config = rangeConfigs[fieldType];
  const bubble = wrapper.querySelector('.range-bubble');
  const customThumb = wrapper.querySelector('.range-custom-thumb');
 
  if (!bubble || !config) return;
 
  if (fieldType === 'loanTenure') {
    input.value = Math.round(Number(input.value));
  }
 
  const sliderValue = Number(input.value);
  const max = Number(input.max);
  const percent = (sliderValue / max) * 100;
 
  const rawActualValue = getActualValueFromSlider(sliderValue, config);
  const actualValue = formatActualValue(rawActualValue, fieldType);
 
  input.dataset.actualValue = actualValue;
  bubble.innerText = config.formatBubble(actualValue);
 
  bubble.style.left = `${percent}%`;
 
  if (customThumb) {
    customThumb.style.left = `${percent}%`;
  }
}
 
export default async function decorate(fieldDiv, fieldJson) {
  const input = fieldDiv.querySelector('input');
  if (!input) return fieldDiv;
 
  if (input.dataset.rangeDecorated === 'true') {
    return fieldDiv;
  }
 
  input.dataset.rangeDecorated = 'true';
 
  const fieldType = getFieldType(input, fieldDiv);
  const config = rangeConfigs[fieldType];
 
  input.dataset.fieldType = fieldType;
  input.type = 'range';
 
  input.min = 0;
  input.max = config.ticks.length - 1;
  input.step = fieldType === 'loanTenure' ? 1 : 0.01;
 
  input.value = getSliderValueFromActual(config.defaultValue, config);
 
  if (fieldType === 'loanTenure') {
    input.value = Math.round(Number(input.value));
  }
 
  const wrapper = document.createElement('div');
  wrapper.className = 'range-widget-wrapper decorated';
 
  input.after(wrapper);
 
  const bubble = document.createElement('span');
  bubble.className = 'range-bubble';
 
  const customThumb = document.createElement('span');
  customThumb.className = 'range-custom-thumb';
 
  wrapper.appendChild(bubble);
  wrapper.appendChild(input);
  wrapper.appendChild(customThumb);
 
  createTicks(input, wrapper, config);
 
  requestAnimationFrame(() => {
    updateBubble(input, wrapper);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
 
  input.addEventListener('input', () => {
    updateBubble(input, wrapper);
  });
 
  input.addEventListener('change', () => {
    updateBubble(input, wrapper);
  });
 
  window.addEventListener('resize', () => {
    updateBubble(input, wrapper);
  });
 
  return fieldDiv;
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
  getFullName, days, submitFormArrayToString, maskMobileNumber, startOtpTimer, stopOtpTimer, handleResendOtp, handleOtpSuccess, handleOtpInvalid, calculateEMI, getTenureActual, debugForm,
};
 