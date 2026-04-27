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

function addRangeStyles() {
  if (document.getElementById('custom-range-style')) return;

  const style = document.createElement('style');
  style.id = 'custom-range-style';
  style.textContent = `
    .range-widget-wrapper {
      position: relative !important;
      width: 100% !important;
      padding-top: 48px !important;
    }

    .range-widget-wrapper input[type="range"] {
      width: 100% !important;
      display: block !important;
      -webkit-appearance: none !important;
      appearance: none !important;
      background: transparent !important;
    }

    /* TRACK */
    .range-widget-wrapper input[type="range"]::-webkit-slider-runnable-track {
      height: 4px !important;
      background: #f2a126 !important;
      border-radius: 4px !important;
    }

    .range-widget-wrapper input[type="range"]::-moz-range-track {
      height: 4px !important;
      background: #f2a126 !important;
      border-radius: 4px !important;
    }

    /* THUMB (BLUE DOT) */
    .range-widget-wrapper input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none !important;
      height: 18px !important;
      width: 18px !important;
      background: #2f5bd3 !important;
      border-radius: 50% !important;
      margin-top: -7px !important;
      cursor: pointer !important;
      border: none !important;
    }

    .range-widget-wrapper input[type="range"]::-moz-range-thumb {
      height: 18px !important;
      width: 18px !important;
      background: #2f5bd3 !important;
      border-radius: 50% !important;
      cursor: pointer !important;
      border: none !important;
    }

    .range-bubble {
      position: absolute !important;
      top: 0 !important;
      transform: translateX(-50%) !important;
      display: inline-block !important;
      padding: 10px 14px !important;
      background: #fff !important;
      border: 1px solid #d1d5db !important;
      border-radius: 8px !important;
      font-size: 16px !important;
      font-weight: 700 !important;
      color: #111 !important;
      white-space: nowrap !important;
      pointer-events: none !important;
      z-index: 9999 !important;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
    }

    .range-ticks {
      display: flex !important;
      justify-content: space-between !important;
      width: 100% !important;
      margin-top: 8px !important;
      font-size: 10px !important;
      color: #5f6b7a !important;
    }

    .range-tick {
      white-space: nowrap !important;
      line-height: 1 !important;
      cursor: pointer;
    }
  `;

  document.head.appendChild(style);
}

function isLoanAmountSlider(input, fieldDiv) {
  const title = fieldDiv.querySelector(
    'label, .field-label, .cmp-adaptiveform-range__label'
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

  for (let i = 0; i < ticks.length - 1; i++) {
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

  return config.ticks[lowerIndex] +
    ((config.ticks[upperIndex] - config.ticks[lowerIndex]) * (value - lowerIndex));
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
}

export default async function decorate(fieldDiv) {
  addRangeStyles();

  const input = fieldDiv.querySelector('input');
  if (!input || input.dataset.rangeDecorated === 'true') return fieldDiv;

  input.dataset.rangeDecorated = 'true';

  const fieldType = getFieldType(input, fieldDiv);
  const config = rangeConfigs[fieldType];

  input.dataset.fieldType = fieldType;
  input.type = 'range';
  input.min = 0;
  input.max = config.ticks.length - 1;
  input.step = fieldType === 'loanTenure' ? 1 : 0.01;

  input.value = getSliderValueFromActual(config.defaultValue, config);

  const wrapper = document.createElement('div');
  wrapper.className = 'range-widget-wrapper';

  input.after(wrapper);

  const bubble = document.createElement('span');
  bubble.className = 'range-bubble';

  wrapper.appendChild(bubble);
  wrapper.appendChild(input);

  createTicks(input, wrapper, config);

  requestAnimationFrame(() => {
    updateBubble(input, wrapper);
  });

  input.addEventListener('input', () => updateBubble(input, wrapper));
  input.addEventListener('change', () => updateBubble(input, wrapper));
  window.addEventListener('resize', () => updateBubble(input, wrapper));

  return fieldDiv;
}