export type Quote = { selection: string; price: number; bookmaker: string };

export type DevigResult = {
  selection: string;
  marketImplied: number;
  fairImplied: number;
  fairOdd: number;
  bestPrice: number;
  bestBookmaker: string;
  edgePct: number;
};

function bestPerSelection(quotes: Quote[]): Map<string, Quote> {
  const best = new Map<string, Quote>();
  for (const q of quotes) {
    const cur = best.get(q.selection);
    if (!cur || q.price > cur.price) best.set(q.selection, q);
  }
  return best;
}

export function devigTwoWay(quotes: Quote[]): DevigResult[] {
  const best = bestPerSelection(quotes);
  if (best.size !== 2) return [];
  return devigMultiway(best);
}

export function devigThreeWay(quotes: Quote[]): DevigResult[] {
  const best = bestPerSelection(quotes);
  if (best.size !== 3) return [];
  return devigMultiway(best);
}

export function devigMultiway(best: Map<string, Quote>): DevigResult[] {
  const arr = Array.from(best.values());
  if (arr.length < 2) return [];
  const impliedSum = arr.reduce((acc, q) => acc + 1 / q.price, 0);
  return arr.map((q) => {
    const marketImplied = 1 / q.price;
    const fairImplied = marketImplied / impliedSum;
    const fairOdd = 1 / fairImplied;
    const edgePct = ((q.price - fairOdd) / fairOdd) * 100;
    return {
      selection: q.selection,
      marketImplied,
      fairImplied,
      fairOdd,
      bestPrice: q.price,
      bestBookmaker: q.bookmaker,
      edgePct
    };
  });
}

export function deriveTotalsLambda(
  pointLine: number,
  overOdd: number,
  underOdd: number
): number {
  const impliedOver = 1 / overOdd;
  const impliedUnder = 1 / underOdd;
  const totalImplied = impliedOver + impliedUnder;
  const fairOver = impliedOver / totalImplied;

  let lo = 0.1;
  let hi = 12;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const probOverAtMid = poissonOverProb(mid, pointLine);
    if (probOverAtMid < fairOver) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function poissonPmf(lambda: number, k: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let logProb = -lambda + k * Math.log(lambda);
  for (let i = 2; i <= k; i++) logProb -= Math.log(i);
  return Math.exp(logProb);
}

export function poissonOverProb(lambda: number, line: number): number {
  let cdfBelow = 0;
  const floor = Math.floor(line);
  for (let k = 0; k <= floor; k++) cdfBelow += poissonPmf(lambda, k);
  if (Number.isInteger(line)) {
    const exactMass = poissonPmf(lambda, line);
    return 1 - (cdfBelow - exactMass * 0.5);
  }
  return 1 - cdfBelow;
}

export { poissonPmf };
