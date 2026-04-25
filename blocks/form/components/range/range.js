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

function getActualValueFromSliderValue(sliderValue, config) {
  const value = Number(sliderValue);
  const lowerIndex = Math.floor(value);
  const upperIndex = Math.ceil(value);

  if (lowerIndex === upperIndex) {
    return config.ticks[lowerIndex];
  }

  const lowerValue = config.ticks[lowerIndex];
  const upperValue = config.ticks[upperIndex];
  const percentage = value - lowerIndex;

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
      updateBubble(input, wrapper);
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

  const sliderValue = Number(input.value);
  const max = config.ticks.length - 1;
  const percent = (sliderValue / max) * 100;

  const rawActualValue = getActualValueFromSliderValue(sliderValue, config);
  const actualValue = formatActualValue(rawActualValue, fieldType);

  input.dataset.actualValue = actualValue;

  bubble.innerText = config.formatBubble(actualValue);
  bubble.style.left = `${percent}%`;
  bubble.style.transform = 'translateX(-50%)';

  wrapper.style.setProperty('--range-progress', `${percent}%`);
}

export default async function decorate(fieldDiv, fieldJson) {
  const input = fieldDiv.querySelector('input');
  if (!input) return fieldDiv;

  const fieldType = getFieldType(input, fieldDiv);
  const config = rangeConfigs[fieldType];

  input.dataset.fieldType = fieldType;
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
  updateBubble(input, wrapper);

  input.addEventListener('input', (e) => {
    updateBubble(e.target, wrapper);
  });

  input.addEventListener('change', (e) => {
    updateBubble(e.target, wrapper);
  });

  return fieldDiv;
}