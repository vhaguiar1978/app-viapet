/**
 * Componentes de gráfico em SVG inline. Sem libs externas — leve, suficiente
 * para sparklines e barras curtas no painel admin.
 */

export function Sparkline({ data = [], width = 200, height = 50, color = "#2563eb", fill = "rgba(37,99,235,0.12)" }) {
  if (!data.length) return null;
  const values = data.map((d) => (typeof d === "object" ? d.value || 0 : d || 0));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = data.length > 1 ? width / (data.length - 1) : width;

  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height;
    return [x, y];
  });

  const path = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const fillPath = `${path} L${width},${height} L0,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path d={fillPath} fill={fill} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}

export function MiniBarChart({ data = [], height = 100, color = "#2563eb" }) {
  if (!data.length) return null;
  const values = data.map((d) => d.value || 0);
  const max = Math.max(...values, 1);
  const barCount = data.length;
  const gap = 4;

  return (
    <div className="admin-mini-bars" style={{ height }}>
      {data.map((d, idx) => {
        const ratio = max ? (d.value || 0) / max : 0;
        const h = Math.max(2, Math.round(ratio * (height - 22)));
        return (
          <div key={`${d.label}-${idx}`} className="admin-mini-bar" title={`${d.label}: ${d.value}`}>
            <span
              className="admin-mini-bar-fill"
              style={{ height: `${h}px`, backgroundColor: color }}
            />
            <small>{d.label?.split("/")[0]}</small>
          </div>
        );
      })}
    </div>
  );
}

export function StackedBar({ segments = [], height = 16 }) {
  // segments: [{ label, value, color }]
  const total = segments.reduce((s, x) => s + (x.value || 0), 0);
  if (total <= 0) {
    return <div className="admin-stacked-bar admin-stacked-empty" style={{ height }} />;
  }
  return (
    <div className="admin-stacked-bar" style={{ height }} title={segments.map((s) => `${s.label}: ${s.value}`).join("\n")}>
      {segments.map((s, idx) => {
        const pct = ((s.value || 0) / total) * 100;
        if (pct <= 0) return null;
        return (
          <span
            key={`${s.label}-${idx}`}
            className="admin-stacked-segment"
            style={{ width: `${pct}%`, backgroundColor: s.color }}
          />
        );
      })}
    </div>
  );
}
