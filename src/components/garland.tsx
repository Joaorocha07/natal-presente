/** Fio de pisca-pisca. Posições fixas para não gerar diferença de hidratação. */
export function Garland() {
  return (
    <div aria-hidden className="lights">
      {Array.from({ length: 40 }, (_, i) => (
        <span key={i} className="seg">
          <span className="bulb" />
        </span>
      ))}
    </div>
  );
}
