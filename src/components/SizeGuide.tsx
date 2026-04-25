interface SizeGuideProps {
  onClose: () => void;
  category: string;
}

export default function SizeGuide({ onClose, category }: SizeGuideProps) {
  const getMeasurementData = () => {
    switch (category) {
      case 'Outerwear':
      case 'Tailoring':
      case 'Basics':
        return [
          { size: 'XS', chest: '34-36"', waist: '28-30"', hip: '34-36"' },
          { size: 'S', chest: '36-38"', waist: '30-32"', hip: '36-38"' },
          { size: 'M', chest: '38-40"', waist: '32-34"', hip: '38-40"' },
          { size: 'L', chest: '40-42"', waist: '34-36"', hip: '40-42"' },
          { size: 'XL', chest: '42-44"', waist: '36-38"', hip: '42-44"' },
          { size: 'XXL', chest: '44-46"', waist: '38-40"', hip: '44-46"' },
        ];
      case 'Bottoms':
        return [
          { size: '28', waist: '28"', hip: '34"', length: '30"' },
          { size: '30', waist: '30"', hip: '36"', length: '32"' },
          { size: '32', waist: '32"', hip: '38"', length: '32"' },
          { size: '34', waist: '34"', hip: '40"', length: '34"' },
          { size: '36', waist: '36"', hip: '42"', length: '34"' },
        ];
      default:
        return [
          { size: 'Standard', note: 'Standard international sizing applies.' }
        ];
    }
  };

  const data = getMeasurementData();
  const columns = Object.keys(data[0]);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 md:p-12 relative z-10 shadow-2xl animate-scale-up overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all text-gray-500"
        >
          ✕
        </button>

        <div className="mb-8">
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-400 mb-2">Technical Specifications</p>
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Size Guide</h2>
          <p className="text-sm text-gray-500 mt-2 font-medium">Measurements for {category} in inches.</p>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-gray-50/50 p-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white">
                {columns.map(col => (
                  <th key={col} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/80 transition-colors group">
                  {columns.map(col => (
                    <td key={col} className="px-6 py-5 text-sm font-bold text-gray-700 group-last:border-none border-b border-gray-100/50">
                      {row[col as keyof typeof row]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 p-6 bg-gray-900 rounded-3xl text-white flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <svg className="w-8 h-8 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-1">Perfect Fit Guarantee</h4>
            <p className="text-xs text-gray-400 leading-relaxed font-medium">If the size isn't exactly right, we offer free returns and exchanges within 30 days of delivery.</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-8 py-4 rounded-2xl border-2 border-gray-900 text-gray-900 text-xs font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all"
        >
          Close Guide
        </button>
      </div>
    </div>
  );
}
