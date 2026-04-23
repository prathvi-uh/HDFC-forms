function formatTick(value, max) {
  const num = Number(value);

  if (max >= 1000000) {
    if (num === 50000) return '50K';
    return `${num / 100000}L`;
  }

  return `${num}m`;
}

function createTicks(input, wrapper) {
  const max = Number(input.max || 0);

  const oldTicks = wrapper.querySelector('.range-ticks');
  if (oldTicks) oldTicks.remove();

  const ticksWrap = document.createElement('div');
  ticksWrap.className = 'range-ticks';

  const tickValues = max >= 1000000
    ? [50000, 200000, 400000, 600000, 800000, 1000000, 1500000]
    : [12, 24, 36, 48, 60, 72, 84];

  tickValues.forEach((tick) => {
    const tickEl = document.createElement('span');
    tickEl.className = 'range-tick';
    tickEl.textContent = formatTick(tick, max);
    ticksWrap.appendChild(tickEl);
  });

  wrapper.appendChild(ticksWrap);
}

function updateBubble(input, element) {
  const step = Number(input.step || 1);
  const max = Number(input.max || 0);
  const min = Number(input.min || 1);
  const value = Number(input.value || 1);
  const current = Math.ceil((value - min) / step);
  const total = Math.ceil((max - min) / step);
  const bubble = element.querySelector('.range-bubble');

  const bubbleWidth = bubble.getBoundingClientRect().width || 31;
  const left = `${(current / total) * 100}% - ${(current / total) * bubbleWidth}px`;

  bubble.innerText = `${value}`;

  const steps = {
    '--total-steps': Math.ceil((max - min) / step),
    '--current-steps': Math.ceil((value - min) / step),
  };

  const style = Object.entries(steps)
    .map(([varName, varValue]) => `${varName}:${varValue}`)
    .join(';');

  bubble.style.left = `calc(${left})`;
  element.setAttribute('style', style);
}

export default async function decorate(fieldDiv, fieldJson) {
  const input = fieldDiv.querySelector('input');

  input.type = 'range';
  input.min = input.min || 1;
  input.max = input.max || 100;
  input.step = fieldJson?.properties?.stepValue || 1;

  const div = document.createElement('div');
  div.className = 'range-widget-wrapper decorated';
  input.after(div);

  const hover = document.createElement('span');
  hover.className = 'range-bubble';

  const rangeMinEl = document.createElement('span');
  rangeMinEl.className = 'range-min';

  const rangeMaxEl = document.createElement('span');
  rangeMaxEl.className = 'range-max';

  rangeMinEl.innerText = `${input.min || 1}`;
  rangeMaxEl.innerText = `${input.max}`;

  div.appendChild(hover);
  div.appendChild(input);
  div.appendChild(rangeMinEl);
  div.appendChild(rangeMaxEl);

  createTicks(input, div);

  input.addEventListener('input', (e) => {
    updateBubble(e.target, div);
  });

  updateBubble(input, div);
  return fieldDiv;
}
