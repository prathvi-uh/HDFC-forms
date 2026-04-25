const rangeConfigs = {
  loanAmount: {
    ticks: [50000, 200000, 400000, 600000, 800000, 1000000, 1500000],
    defaultValue: 600000,
    formatBubble: (value) => `₹${Number(value).toLocaleString('en-IN')}`,
    formatTick: (value) => (value === 50000 ? '50K' : `${value / 100000}L`),
  },
  loanTenure: {
    ticks: [12, 24, 36, 48, 60, 72, 84],
    defaultValue: 60,
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

  if (lowerIndex === upperIndex) {
    return config.ticks[lowerIndex];
  }

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

  const sliderValue = Number(input.value);
  const max = config.ticks.length - 1;
  const percent = (sliderValue / max) * 100;

  const rawActualValue = getActualValueFromSlider(sliderValue, config);
  const actualValue = formatActualValue(rawActualValue, fieldType);

  input.dataset.actualValue = actualValue;

  bubble.innerText = config.formatBubble(actualValue);

  const thumbWidth = 14;
  const sliderWidth = input.offsetWidth;
  const left = ((sliderWidth - thumbWidth) * percent) / 100 + (thumbWidth / 2);

  bubble.style.left = `${left}px`;
  bubble.style.transform = 'translateX(-50%)';

  if (customThumb) {
    customThumb.style.left = `${left}px`;
  }

  wrapper.style.setProperty('--range-progress', `${percent}%`);
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

  const currentValue = Number(input.value || config.defaultValue);

  input.min = 0;
  input.max = config.ticks.length - 1;
  input.step = 0.01;

  input.value = currentValue > config.ticks.length - 1
    ? getSliderValueFromActual(currentValue, config)
    : currentValue;

  const wrapper = document.createElement('div');
  wrapper.className = 'range-widget-wrapper decorated';
  wrapper.style.position = 'relative';
  wrapper.style.width = '100%';
  wrapper.style.paddingTop = '48px';

  input.after(wrapper);

  const bubble = document.createElement('span');
  bubble.className = 'range-bubble';
  bubble.style.position = 'absolute';
  bubble.style.top = '0';
  bubble.style.left = '0';
  bubble.style.transform = 'translateX(-50%)';
  bubble.style.pointerEvents = 'none';
  bubble.style.whiteSpace = 'nowrap';
  bubble.style.zIndex = '9999';

  const customThumb = document.createElement('span');
  customThumb.className = 'range-custom-thumb';

  wrapper.appendChild(bubble);
  wrapper.appendChild(input);
  wrapper.appendChild(customThumb);

  input.style.width = '100%';
  input.style.display = 'block';

  createTicks(input, wrapper, config);

  requestAnimationFrame(() => {
    updateBubble(input, wrapper);
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
