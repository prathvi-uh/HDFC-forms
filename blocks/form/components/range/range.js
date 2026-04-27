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

function showSliderValue(wrapper) {
  const bubble = wrapper.querySelector('.range-bubble');
  const customThumb = wrapper.querySelector('.range-custom-thumb');

  if (bubble) bubble.style.setProperty('display', 'inline-block', 'important');
  if (customThumb) customThumb.style.setProperty('display', 'block', 'important');
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
      showSliderValue(wrapper);
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
  const sliderWidth = input.getBoundingClientRect().width || wrapper.getBoundingClientRect().width;
  const left = ((sliderWidth - thumbWidth) * percent) / 100 + (thumbWidth / 2);

  bubble.style.setProperty('position', 'absolute', 'important');
  bubble.style.setProperty('top', '0', 'important');
  bubble.style.setProperty('left', `${left}px`, 'important');
  bubble.style.setProperty('transform', 'translateX(-50%)', 'important');

  if (customThumb) {
    customThumb.style.setProperty('position', 'absolute', 'important');
    customThumb.style.setProperty('left', `${left}px`, 'important');
    customThumb.style.setProperty('transform', 'translateX(-50%)', 'important');
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

  input.min = 0;
  input.max = config.ticks.length - 1;
  input.step = fieldType === 'loanTenure' ? 1 : 0.01;

  const defaultSliderValue = getSliderValueFromActual(config.defaultValue, config);
  input.value = fieldType === 'loanTenure'
    ? Math.round(defaultSliderValue)
    : defaultSliderValue;

  const wrapper = document.createElement('div');
  wrapper.className = 'range-widget-wrapper decorated';
  wrapper.style.setProperty('position', 'relative', 'important');
  wrapper.style.setProperty('width', '100%', 'important');
  wrapper.style.setProperty('padding-top', '48px', 'important');

  input.after(wrapper);

  const bubble = document.createElement('span');
  bubble.className = 'range-bubble';

  const customThumb = document.createElement('span');
  customThumb.className = 'range-custom-thumb';

  wrapper.appendChild(bubble);
  wrapper.appendChild(input);
  wrapper.appendChild(customThumb);

  input.style.setProperty('width', '100%', 'important');
  input.style.setProperty('display', 'block', 'important');

  createTicks(input, wrapper, config);

  showSliderValue(wrapper);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      updateBubble(input, wrapper);
    });
  });

  setTimeout(() => {
    updateBubble(input, wrapper);
  }, 500);

  input.addEventListener('input', () => {
    if (fieldType === 'loanTenure') {
      input.value = Math.round(Number(input.value));
    }

    showSliderValue(wrapper);
    updateBubble(input, wrapper);
  });

  input.addEventListener('change', () => {
    if (fieldType === 'loanTenure') {
      input.value = Math.round(Number(input.value));
    }

    showSliderValue(wrapper);
    updateBubble(input, wrapper);
  });

  window.addEventListener('resize', () => {
    updateBubble(input, wrapper);
  });

  return fieldDiv;
}
