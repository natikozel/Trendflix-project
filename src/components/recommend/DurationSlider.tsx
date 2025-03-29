'use client';

interface DurationSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const DurationSlider = ({ value, onChange }: DurationSliderProps) => {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-400">Duration</span>
        <span className="text-sm font-medium">{formatDuration(value)}</span>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min="60"
          max="240"
          step="15"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        
        {/* Custom thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full cursor-pointer"
          style={{
            left: `${((value - 60) / (240 - 60)) * 100}%`,
            transform: 'translate(-50%, -50%)'
          }}
        />
        
        {/* Time markers */}
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>1h</span>
          <span>2h</span>
          <span>3h</span>
          <span>4h</span>
        </div>
      </div>
    </div>
  );
};

export default DurationSlider; 