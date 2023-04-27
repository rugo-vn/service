function tickTimer(timer, fn) {
  const top = timer.stops[timer.stops.length - 1];
  const now = Date.now();

  timer.stops.push(now);
  if (fn) {
    fn(now - top);
  }
}

export function createTimer() {
  const timer = {
    stops: [Date.now()],
  };

  timer.tick = (fn) => tickTimer(timer, fn);

  return timer;
}
