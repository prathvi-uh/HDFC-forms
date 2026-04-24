const rangeConfigs = {
  loanAmount: {
    ticks: [50000, 200000, 400000, 600000, 800000, 1000000, 1500000],
    defaultValue: 1500000,
    formatBubble: (value) => `₹${Number(value).toLocaleString('en-IN')}`,
    formatTick: (value) => (value === 50000 ? '50K' : `${value / 100000}L`),
  },
  loanTenure: {
    ticks: [12, 24, 36, 48, 60, 72, 84],
    defaultValue: 48,
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

function getActualValueFromSlider(input, config) {
  const sliderValue = Number(input.value);
  const lowerIndex = Math.floor(sliderValue);
  const upperIndex = Math.ceil(sliderValue);

  if (lowerIndex === upperIndex) {
    return config.ticks[lowerIndex];
  }

  const lowerValue = config.ticks[lowerIndex];
  const upperValue = config.ticks[upperIndex];
  const percentage = sliderValue - lowerIndex;

  return lowerValue + ((upperValue - lowerValue) * percentage);
}

function getSliderValueFromActual(actualValue, config) {
  const ticks = config.ticks;

  if (actualValue <= ticks[0]) return 0;
  if (actualValue >= ticks[ticks.length - 1]) return ticks.length - 1;

  for (let i = 0; i < ticks.length - 1; i += 1) {
    if (actualValue >= ticks[i] && actualValue <= ticks[i + 1]) {
      const percentage = (actualValue - ticks[i]) / (ticks[i + 1] - ticks[i]);
      return i + percentage;
    }
  }

  return 0;
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
  const oldTicks = wrapper.querySelector('.range-ticks');
  if (oldTicks) oldTicks.remove();

  const ticksWrap = document.createElement('div');
  ticksWrap.className = 'range-ticks';

  config.ticks.forEach((tickValue, index) => {
    const tickEl = document.createElement('span');
    tickEl.className = 'range-tick';
    tickEl.textContent = config.formatTick(tickValue);
    tickEl.style.left = `${(index / (config.ticks.length - 1)) * 100}%`;

    tickEl.addEventListener('click', () => {
      input.value = index;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    ticksWrap.appendChild(tickEl);
  });

  wrapper.appendChild(ticksWrap);
}

function updateBubble(input, wrapper, fieldType) {
  const config = rangeConfigs[fieldType];
  const bubble = wrapper.querySelector('.range-bubble');

  if (!bubble || !config) return;

  const rawActualValue = getActualValueFromSlider(input, config);
  const actualValue = formatActualValue(rawActualValue, fieldType);

  const percent = (Number(input.value) / (config.ticks.length - 1)) * 100;

  input.dataset.actualValue = actualValue;
  bubble.innerText = config.formatBubble(actualValue);
  bubble.style.left = `${percent}%`;

  if (percent <= 5) {
    bubble.style.transform = 'translateX(0)';
  } else if (percent >= 95) {
    bubble.style.transform = 'translateX(-100%)';
  } else {
    bubble.style.transform = 'translateX(-50%)';
  }

  wrapper.style.setProperty('--range-progress', `${percent}%`);
}

export default async function decorate(fieldDiv, fieldJson) {
  const input = fieldDiv.querySelector('input');
  if (!input) return fieldDiv;

  const fieldType = getFieldType(input, fieldDiv);
  const config = rangeConfigs[fieldType];

  input.type = 'range';

  const originalActualValue = Number(input.value || config.defaultValue);
  const sliderValue = getSliderValueFromActual(originalActualValue, config);

  input.min = 0;
  input.max = config.ticks.length - 1;
  input.step = 0.01;
  input.value = sliderValue;

  const wrapper = document.createElement('div');
  wrapper.className = 'range-widget-wrapper decorated';
  input.after(wrapper);

  const bubble = document.createElement('span');
  bubble.className = 'range-bubble';

  wrapper.appendChild(bubble);
  wrapper.appendChild(input);

  createTicks(input, wrapper, config);
  updateBubble(input, wrapper, fieldType);

  input.addEventListener('input', (e) => {
    updateBubble(e.target, wrapper, fieldType);
  });

  input.addEventListener('change', (e) => {
    updateBubble(e.target, wrapper, fieldType);
  });

  return fieldDiv;
}