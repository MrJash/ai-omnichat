
import React, { useEffect, useRef, useState } from 'react';

declare const mermaid: any;

interface FlowchartProps {
  chart: string;
}

const Flowchart: React.FC<FlowchartProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (containerRef.current && chart) {
      const id = `mermaid-chart-${Math.random().toString(36).substr(2, 9)}`;
      try {
        mermaid.render(id, chart, (renderedSvg: string) => {
          setSvg(renderedSvg);
          setError('');
        });
      } catch (e) {
        if (e instanceof Error) {
            setError('Invalid flowchart syntax.');
            console.error(e);
        }
      }
    }
  }, [chart]);

  return (
    <div className="bg-[var(--color-flowchart-bg)] p-4 my-2 rounded-lg text-black overflow-x-auto">
      {error ? (
        <pre className="text-red-500">{error}</pre>
      ) : (
        <div ref={containerRef} dangerouslySetInnerHTML={{ __html: svg }} />
      )}
    </div>
  );
};

export default Flowchart;
