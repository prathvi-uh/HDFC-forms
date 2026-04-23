function isLoanAmountSlider(input, fieldDiv) {
  const title = fieldDiv.querySelector(
    'label, .field-label, .cmp-adaptiveform-textinput__label, .cmp-adaptiveform-numberinput__label, .cmp-adaptiveform-range__label'
  );
  const labelText = title ? title.textContent.toLowerCase() : '';

  return labelText.includes('loan amount');
}

function getTickValues(input, fieldDiv) {
  if (isLoanAmountSlider(input, fieldDiv)) {
    return [50000, 200000, 400000, 600000, 800000, 1000000, 1500000];
  }

  return [12, 24, 36, 48, 60, 72, 84];
}

function formatTick(value, input, fieldDiv) {
  const num = Number(value);

  if (isLoanAmountSlider(input, fieldDiv)) {
    if (num === 50000) return '50K';
    return `${num / 100000}L`;
  }

  return `${num}m`;
}

function formatBubbleValue(value, input, fieldDiv) {
  const num = Number(value);

  if (isLoanAmountSlider(input, fieldDiv)) {
    return `₹${num.toLocaleString('en-IN')}`;
  }

  return `${num} months`;
}

function getPercent(value, min, max) {
  min = Number(min);
  max = Number(max);
  value = Number(value);

  if (max <= min) return 0;
  return ((value - min) / (max - min)) * 100;
}

function createTicks(input, wrapper, fieldDiv) {
  const min = Number(input.min || 0);
  const max = Number(input.max || 0);
  const tickValues = getTickValues(input, fieldDiv);

  const oldTicks = wrapper.querySelector('.range-ticks');
  if (oldTicks) oldTicks.remove();

  const ticksWrap = document.createElement('div');
  ticksWrap.className = 'range-ticks';

  tickValues.forEach((tick) => {
    if (tick < min || tick > max) return;

    const tickEl = document.createElement('span');
    tickEl.className = 'range-tick';
    tickEl.textContent = formatTick(tick, input, fieldDiv);

    const percent = getPercent(tick, min, max);
    tickEl.style.left = `${percent}%`;

    ticksWrap.appendChild(tickEl);
  });

  wrapper.appendChild(ticksWrap);
}

function updateBubble(input, wrapper, fieldDiv) {
  const min = Number(input.min || 0);
  const max = Number(input.max || 0);
  const value = Number(input.value || min);

  const bubble = wrapper.querySelector('.range-bubble');
  const percent = getPercent(value, min, max);

  bubble.innerText = formatBubbleValue(value, input, fieldDiv);
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

  input.type = 'range';
  input.min = input.min || 1;
  input.max = input.max || 100;
  input.step = fieldJson?.properties?.stepValue || 1;

  const wrapper = document.createElement('div');
  wrapper.className = 'range-widget-wrapper decorated';
  input.after(wrapper);

  const bubble = document.createElement('span');
  bubble.className = 'range-bubble';

  const rangeMinEl = document.createElement('span');
  rangeMinEl.className = 'range-min';

  const rangeMaxEl = document.createElement('span');
  rangeMaxEl.className = 'range-max';

  rangeMinEl.innerText = formatTick(input.min, input, fieldDiv);
  rangeMaxEl.innerText = formatTick(input.max, input, fieldDiv);

  wrapper.appendChild(bubble);
  wrapper.appendChild(input);
  wrapper.appendChild(rangeMinEl);
  wrapper.appendChild(rangeMaxEl);

  createTicks(input, wrapper, fieldDiv);

  input.addEventListener('input', (e) => {
    updateBubble(e.target, wrapper, fieldDiv);
  });

  updateBubble(input, wrapper, fieldDiv);

  return fieldDiv;
}
