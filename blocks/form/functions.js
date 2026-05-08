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

  if ( window.otpTimerExpired === true && window.otpResendAttemptsLeft > 0){
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

    if(globals.form.tryagain) {
      globals.functions.setProperty(globals.form.tryagain, {
        visible:true
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
 
  const payload = {
    mobile
  };
 
  if (pan) {
    payload.loginType = "PAN";
    payload.pan = pan.toUpperCase();
  } else if (dob) {
    payload.loginType = "DOB";
    payload.dateOfBirth = dob;
  }
 
  console.log('PAYLOAD:', payload);
 
  fetch('https://await-matchbox-certify.ngrok-free.dev/generate-otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      console.log('API RESPONSE:', data);
 
      if (data.success) {
        globals.functions.setProperty(form.otp_verification.entered_otp, {
          value: data.otp
        });
 
        if(window.otpAttemptsLeft == undefined){
          window.otpAttemptsLeft=3;
        }
        starttimer(globals);
      }
    });
 
  return 'Generating OTP...';
}
 
/**
* @param {scope} globals
*/ 
function initOtpState(globals) {
  window.otpAttemptsLeft = 3;
  return updateAttemptInfo(globals);
}
 
/**
* @param {scope} globals
*/ 
function updateAttemptInfo(globals) {
  const form = globals.form;

  if (window.otpAttemptsLeft === undefined) {
    window.otpAttemptsLeft = 3;
  }

  // ✅ When no attempts left
  if (window.otpAttemptsLeft <= 0) {
    globals.functions.setProperty(form.otp_verification, {
      visible: false
    });

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

  // ✅ Normal attempt display
  globals.functions.setProperty(form.otp_verification.attempt_info, {
    value: `${window.otpAttemptsLeft}/3 attempts left`
  });

  return '';
}

/**
* @param {scope} globals
*/
function starttimer(globals) {
  const form = globals.form;
  let timeLeft = 10;

  if (window.otpTimer) clearInterval(window.otpTimer);

  globals.functions.setProperty(form.otp_verification.resend_otp, {
    visible: false,
    enabled: false
  });

  globals.functions.setProperty(form.otp_verification.otp_submit, {
    enabled: true
  });

  updateAttemptInfo(globals);

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

      reduceOtpAttempt(globals, "timeout");
    }
  }, 1000);

  return "";
}
 
/**
* @param {scope} globals
*/
function reduceOtpAttempt(globals, reason) {
  const form = globals.form;

  if (window.otpAttemptsLeft === undefined) {
    window.otpAttemptsLeft = 3;
  }

  window.otpAttemptsLeft--;

  updateAttemptInfo(globals);

  globals.functions.setProperty(form.otp_verification.otp_submit, {
    enabled: false
  });

  globals.functions.setProperty(form.otp_verification.resend_otp, {
    visible: true,
    enabled: true
  });

  globals.functions.setProperty(form.otp_verification.timer, {
    value: reason === "invalid"
      ? "Invalid OTP"
      : "Time expired"
  });

  if (window.otpAttemptsLeft <= 0) {
    globals.functions.setProperty(form.otp_verification, {
      visible: false
    });

    globals.functions.setProperty(form.zerotry.retry, {
      visible: true
    });

    window.otpAttemptsLeft = undefined;
  }

  return "";
}

/**
 * @param {scope} globals
 */
function stopInvalidOtp(globals) {
  if (window.otpTimer) clearInterval(window.otpTimer);
  return reduceOtpAttempt(globals, 'invalid');
}

/**
 * @param {scope} globals
 */
function verifyOtp(globals) {
  const form = globals.form;

  const mobile = String(form.personal_loan_offer.mobile?.$value || "").trim();

  const otp = String(form.otp_verification.entered_otp?.$value || "")
    .replace(/\s/g, "")
    .trim();

  console.log("VERIFY PAYLOAD:", { mobile, otp });

  fetch("https://await-matchbox-certify.ngrok-free.dev/verify-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true"
    },
    body: JSON.stringify({
      mobile: mobile,
      otp: otp
    })
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("VERIFY RESPONSE:", data);

      // VALID OTP
      if (data.success === true) {
        if (window.otpTimer) {
          clearInterval(window.otpTimer);
        }

        globals.functions.setProperty(form.otp_verification, {
          visible: false
        });
        
        globals.functions.setProperty(form.nameaadhar, {
          visible: true
        });

        globals.functions.setProperty(form.nameaadhar.full.customer.full_name,{
          value: data.name
        });
        
        globals.functions.setProperty(form.info.addpanel.address_details.aadharadd, {
        value: data.address
        });     

        globals.functions.setProperty(form.info, {
          visible: true
        });

        globals.functions.setProperty(form.continue, {
          visible: true
        });

        return;
      }

      handleInvalidFlow(globals);
    })
    .catch((error) => {
      console.error("VERIFY ERROR:", error);
      handleInvalidFlow(globals);
    });

  return "Verifying OTP...";
}
/** 
 * @param {scope} globals
 */
function handleInvalidFlow(globals) {
  const form = globals.form;

  // stop timer
  if (window.otpTimer) {
    clearInterval(window.otpTimer);
  }

  // reduce attempt
  if (window.otpAttemptsLeft === undefined) {
    window.otpAttemptsLeft = 3;
  }

  window.otpAttemptsLeft--;

  // update attempt text / retry panel if 0
  updateAttemptInfo(globals);

  // if attempts finished, stop here
  if (window.otpAttemptsLeft <= 0) {
    return "No attempts left";
  }

  // disable submit
  globals.functions.setProperty(form.otp_verification.otp_submit, {
    enabled: false
  });

  // enable resend
  globals.functions.setProperty(form.otp_verification.resend_otp, {
    visible: true,
    enabled: true
  });

  // show invalid text in timer area
  globals.functions.setProperty(form.otp_verification.timer, {
    value: "Invalid OTP"
  });

  return "Invalid OTP";
}

/**
 * @param {scope} globals
 */
function proceedApi(globals) {
  const form = globals.form;

  const mobile =
    form.personal_loan_offer.mobile?.$value || "";

  console.log("PROCEED PAYLOAD:", { mobile });

  fetch("https://await-matchbox-certify.ngrok-free.dev/proceed", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true"
    },
    body: JSON.stringify({
      mobile: mobile
    })
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("PROCEED RESPONSE:", data);

      if (data.success) {

        // ✅ map values
        globals.functions.setProperty(form.review.view_details.loan_accordion.loan_details.processing_fee, {
          value: data.data.processingFees
        });

        globals.functions.setProperty(
          form.review.view_details.loan_accordion.loan_details.schedule_of_charges,
          {
            value: data.data.scheduleOfCharges
          }
        );

        globals.functions.setProperty(form.review.view_details.loan_accordion.personal_details.date_of_birth,{
          value: data.data.dob
        });
        
        globals.functions.setProperty(form.review.view_details.loan_accordion.loan_details.type_of_loan, {
          value:data.data.typeOfLoan
        });

        globals.functions.setProperty(form.thankyou.appnumber,{
           value: data.data.loanApplicationNumber
        });      
        
        globals.functions.setProperty(form.redetails.halfreview.accdet.salary_account_details.salary_ac_number, {
            value: data.data.salaryAccountNumber
          });
            
        globals.functions.setProperty( form.redetails.halfreview.accdet.salary_account_details.ifsc,
         {
          value: data.data.ifscCode
        });

        globals.functions.setProperty(form.redetails.halfreview.accdet.salary_account_details.bank_name,{
          value: data.data.bankName
        });

        globals.functions.setProperty(form.review.view_details.loan_accordion.personal_details.residence_type,{
          value: data.data.residenceType
        });
        
        globals.functions.setProperty(form.redetails.halfreview.accdet.office_address_panel.curr_emp, {
         value: data.data.officeAddress
        });

        globals.functions.setProperty( form.redetails.halfreview.accdet.reference_details_panel.fullname, {
          value: data.data.referenceName
        });

        globals.functions.setProperty(form.review.view_details.loan_accordion.personal_details.mobile_number,{
          value: form.personal_loan_offer.mobile?.$value || ""
        });  

        globals.functions.setProperty(form.review, {
          visible: true
        });

        globals.functions.setProperty(form.offer, {
          visible:false
        });
        
        globals.functions.setProperty(form.discount, {
          visible: false
        });

        globals.functions.setProperty(form.display, {
          visible:false
        });

        globals.functions.setProperty(form.proceed,{
          visible:false
        });
        
        globals.functions.setProperty(form.redetails, {
          visible: true
        });

        globals.functions.setProperty(form.confirm, {
          visible: true
        });

      } else {
        console.log("PROCEED ERROR:", data.message);

        if (!data.success) {
            globals.functions.setProperty(form.error, {
            visible: true
          });

            globals.functions.setProperty(form.error, {
            value: data.message,
          });

           globals.functions.setProperty(form.proceed, {
            visible: false
          });

          globals.functions.setProperty(form.discount, {
            visible: false
          });

          globals.functions.setProperty(form.display, {
            visible: false
          });

          globals.functions.setProperty(form.offer,{
            visible:false
          });

        return false;

        }
      }
    })
    .catch((err) => {
      console.log("API ERROR:", err);
    });

  return "Fetching proceed data...";
}

/**
 * @param {scope} globals
 */
function generateEmailOtp(globals) {

  const form = globals.form;

  const email =
    form.info.addpanel.personal_detail.mailid?.$value || "";

  console.log("EMAIL OTP PAYLOAD:", { email });

  fetch("https://await-matchbox-certify.ngrok-free.dev/generateEmailOTP", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true"
    },
    body: JSON.stringify({
      email: email
    })
  })
    .then((res) => res.json())
    .then((data) => {

      console.log("EMAIL OTP RESPONSE:", data);

      if (data.success) {

        // ✅ Auto fill OTP field
        globals.functions.setProperty(
          form.info.addpanel.personal_detail.email_otp,
          {
            value: data.otp,
            visible: true
          }
        );

        // ✅ Show submit button
        globals.functions.setProperty(
          form.info.addpanel.personal_detail.mail_submit,
          {
            visible: true
          }
        );

      } else {

        console.log("EMAIL OTP ERROR:", data.message);

      }
    })
    .catch((err) => {

      console.log("EMAIL OTP API ERROR:", err);

    });

  return "Generating Email OTP...";
}

/**
 * @param {scope} globals
 */
function validateEmailOtp(globals) {

  const form = globals.form;

  const email =
    form.info.addpanel.personal_detail.mailid?.$value || "";

  const otp =
    String(form.info.addpanel.personal_detail.email_otp?.$value || "").trim();

  fetch("https://await-matchbox-certify.ngrok-free.dev/validateEmailOTP", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true"
    },
    body: JSON.stringify({
      email,
      otp
    })
  })
    .then((res) => res.json())
    .then((data) => {

      console.log("EMAIL OTP VALIDATION:", data);

      if (data.success) {

        // ✅ style verify button as verified
        setTimeout(() => {

          const verifyBtn = document.querySelector(
           ".field-verify-email button"
          );

          if (verifyBtn) {

            verifyBtn.innerText = "Verified ✔";

            verifyBtn.style.background = "#16a34a";
            verifyBtn.style.color = "#ffffff";

            verifyBtn.style.border =
              "1px solid #16a34a";

            verifyBtn.style.borderRadius = "12px";

            verifyBtn.style.fontWeight = "700";

            verifyBtn.style.cursor = "default";

            verifyBtn.style.boxShadow =
              "0 2px 8px rgba(22,163,74,0.25)";

            verifyBtn.disabled = true;
          }

        }, 200);

        // ✅ hide otp field
        globals.functions.setProperty(
          form.info.addpanel.personal_detail.email_otp,
          {
            visible: false
          }
        );

        // ✅ hide submit button
        globals.functions.setProperty(
          form.info.addpanel.personal_detail.mail_submit,
          {
            visible: false
          }
        );

      } else {

        setTimeout(() => {

          const verifyBtn = document.querySelector(
          ".field-verify-email button"
        );

        if (verifyBtn) {

          verifyBtn.innerText = "Invalid OTP ✖";

          verifyBtn.style.background = "#dc2626";
          verifyBtn.style.color = "#ffffff";

          verifyBtn.style.border =
            "1px solid #dc2626";

          verifyBtn.style.borderRadius = "12px";

          verifyBtn.style.fontWeight = "700";

          verifyBtn.style.boxShadow =
            "0 2px 8px rgba(220,38,38,0.25)";
        }
}, 200);

// after 2 sec restore verify button
setTimeout(() => {

  const verifyBtn = document.querySelector(
    ".field-verify-email button"
  );

  if (verifyBtn) {

    verifyBtn.innerText = "Verify";

    verifyBtn.style.background = "#ffffff";
    verifyBtn.style.color = "#2563eb";

    verifyBtn.style.border =
      "1px solid #c7d2fe";

    verifyBtn.style.boxShadow = "none";

  }

}, 2000);

      }

    })
    .catch((err) => {

      console.log("VALIDATE EMAIL OTP ERROR:", err);

    });

  return "Validating Email OTP...";
}

/**
 * @param {scope} globals
 */
function getBureauOffer(globals) {

  const form = globals.form;

  fetch("https://await-matchbox-certify.ngrok-free.dev/GetBureauOffer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true"
    },
    body: JSON.stringify({})
  })
    .then((res) => res.json())
    .then((data) => {

      console.log("BUREAU RESPONSE:", data);

      if (data.success === true) {

        globals.functions.setProperty(
          form.display.loandisplay,
          {
            value: data.data.offerAmount
          }
        );

        globals.functions.setProperty(
          form.display.emi,
          {
            value: data.data.emiAmount
          }
        );

      }

    })
    .catch((error) => {

      console.log("BUREAU ERROR:", error);

    });

  return "Fetching Bureau Offer...";
}

/**
 * @param {scope} globals
 */
function generateWorkEmailOtp(globals) {

  const form = globals.form;

  const email =
    form.info.addpanel.det.work_email_id_panel.work_email_id?.$value || "";

  console.log("WORK EMAIL OTP PAYLOAD:", { email });

  fetch("https://await-matchbox-certify.ngrok-free.dev/generateEmailOTP", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true"
    },
    body: JSON.stringify({
      email: email
    })
  })
    .then((res) => res.json())
    .then((data) => {

      console.log("WORK EMAIL OTP RESPONSE:", data);

      if (data.success) {

        // ✅ Auto fill OTP field
        globals.functions.setProperty(
          form.info.addpanel.det.work_email_id_panel.otp_work,
          {
            value: data.otp,
            visible: true
          }
        );

        // ✅ Show submit button
        globals.functions.setProperty(
          form.info.addpanel.det.work_email_id_panel.mail_submits,
          {
            visible: true
          }
        );

      } else {

        console.log("WORK EMAIL OTP ERROR:", data.message);

      }

    })
    .catch((err) => {

      console.log("WORK EMAIL OTP API ERROR:", err);

    });

  return "Generating Work Email OTP...";
}


/**
 * @param {scope} globals
 */
function validateWorkEmailOtp(globals) {

  const form = globals.form;

  const email =
    form.info.addpanel.det.work_email_id_panel.work_email_id?.$value || "";

  const otp =
    String(
      form.info.addpanel.det.work_email_id_panel.otp_work?.$value || ""
    ).trim();

  fetch("https://await-matchbox-certify.ngrok-free.dev/validateEmailOTP", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true"
    },
    body: JSON.stringify({
      email,
      otp
    })
  })
    .then((res) => res.json())
    .then((data) => {

      console.log("WORK EMAIL OTP VALIDATION:", data);

      // ✅ SUCCESS
      if (data.success) {

        setTimeout(() => {

          const verifyBtn = document.querySelector(
            ".field-verify-work-email-button .button"
          );

          if (verifyBtn) {

            verifyBtn.innerText = "Verified ✔";

            verifyBtn.style.background = "#ffffff";

            verifyBtn.style.color = "#2563eb";

            verifyBtn.style.border =
              "1px solid #c7d2fe";

            verifyBtn.style.borderRadius = "16px";

            verifyBtn.style.fontWeight = "700";

            verifyBtn.style.fontSize = "16px";

            verifyBtn.style.height = "48px";

            verifyBtn.style.minWidth = "160px";

            verifyBtn.style.padding = "0 28px";

            verifyBtn.style.boxShadow =
              "0 2px 10px rgba(37,99,235,0.12)";

            verifyBtn.style.display = "inline-flex";

            verifyBtn.style.alignItems = "center";

            verifyBtn.style.justifyContent = "center";

            verifyBtn.style.cursor = "default";
          }

        }, 200);

        // ✅ hide otp field
        globals.functions.setProperty(
          form.info.addpanel.det.work_email_id_panel.otp_work,
          {
            visible: false
          }
        );

        // ✅ hide submit button
        globals.functions.setProperty(
          form.info.addpanel.det.work_email_id_panel.mail_submits,
          {
            visible: false
          }
        );

      }

      // ❌ INVALID OTP
      else {

        setTimeout(() => {

          const verifyBtn = document.querySelector(
            ".field-verify-work-email-button .button"
          );

          if (verifyBtn) {

            verifyBtn.innerText = "Invalid OTP ✖";

            verifyBtn.style.background = "#dc2626";

            verifyBtn.style.color = "#ffffff";

            verifyBtn.style.border =
              "1px solid #dc2626";

            verifyBtn.style.borderRadius = "12px";

            verifyBtn.style.fontWeight = "700";

            verifyBtn.style.boxShadow =
              "0 2px 8px rgba(220,38,38,0.25)";
          }

        }, 200);

        // restore button
        setTimeout(() => {

          const verifyBtn = document.querySelector(
            ".field-verify-work-email-button .button"
          );

          if (verifyBtn) {

            verifyBtn.innerText = "Verify";

            verifyBtn.style.background = "#ffffff";

            verifyBtn.style.color = "#2563eb";

            verifyBtn.style.border =
              "1px solid #c7d2fe";

            verifyBtn.style.borderRadius = "12px";

            verifyBtn.style.fontWeight = "600";

            verifyBtn.style.boxShadow = "none";
          }

        }, 2000);

      }

    })
    .catch((err) => {

      console.log("VALIDATE WORK EMAIL OTP ERROR:", err);

    });

  return "Validating Work Email OTP...";
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
  getFullName, days, submitFormArrayToString, maskMobileNumber, startOtpTimer, stopOtpTimer, handleResendOtp, handleOtpSuccess, proceedApi, handleOtpInvalid, generateWorkEmailOtp,validateWorkEmailOtp, calculateEMI,generateEmailOtp, restoreReviewLoanDetails,getBureauOffer, generateOtp, debugForm,starttimer, verifyOtp,handleInvalidFlow, updateAttemptInfo, reduceOtpAttempt, validateEmailOtp, stopInvalidOtp,initOtpState, 
};
 