export default function About() {
  return (
    <div className="animate-fade-in relative z-10 w-full pt-32 pb-32">
      <div className="max-w-4xl mx-auto px-8 text-center mb-24">
        <h1 className="text-5xl font-extrabold tracking-tight mb-6">Our Philosophy.</h1>
        <p className="text-xl text-gray-500 font-light leading-relaxed">
          At AURA, we believe that clothing should be an effortless extension of your identity. 
          Founded in 2026, our mission is to cut through the noise of fast fashion by delivering meticulously crafted, 
          timeless pieces that form the foundation of a modern wardrobe.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
        <div className="glass-card rounded-3xl p-2 overflow-hidden h-[400px]">
          <img 
            src="https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&q=80&w=1200" 
            className="w-full h-full object-cover rounded-2xl filter grayscale hover:grayscale-0 transition-all duration-700" 
            alt="AURA atelier design process with fabric swatches and tailoring tools" 
            loading="lazy"
          />
        </div>
        <div className="flex flex-col justify-center p-8 md:p-12 glass-panel rounded-3xl">
          <h2 className="text-2xl font-bold tracking-tight mb-4">Meticulous Craftsmanship</h2>
          <p className="text-gray-500 font-light leading-relaxed mb-6">
            Every thread, every seam, and every silhouette is heavily scrutinized. We partner with ethical ateliers that prioritize quality over quantity, ensuring that each garment is built to last both in durability and style.
          </p>
          <div className="w-12 h-1 bg-black rounded"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
        <div className="flex flex-col justify-center p-8 md:p-12 glass-panel rounded-3xl order-2 md:order-1">
          <h2 className="text-2xl font-bold tracking-tight mb-4">Sustainable Futures</h2>
          <p className="text-gray-500 font-light leading-relaxed mb-6">
            We are committed to reducing our footprint. From sourcing organic fibers to utilizing recycled packaging, we are constantly taking steps to ensure our impact on the planet is as minimal as our aesthetic.
          </p>
          <div className="w-12 h-1 bg-black rounded"></div>
        </div>
        <div className="glass-card rounded-3xl p-2 overflow-hidden h-[400px] order-1 md:order-2">
          <img 
            src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1200&q=80" 
            className="w-full h-full object-cover rounded-2xl filter grayscale hover:grayscale-0 transition-all duration-700" 
            alt="Sustainable fashion featuring natural linen fabric textures and eco-friendly materials" 
            loading="lazy"
          />
        </div>
      </div>

      <div className="text-center py-20 px-8 glass-dark rounded-3xl max-w-5xl mx-auto">
        <h2 className="text-3xl text-white font-bold tracking-widest uppercase mb-6">Join The Aesthetic</h2>
        <p className="text-gray-400 font-light mb-8 max-w-md mx-auto">Follow our journey and stay updated with the latest drops and sustainable initiatives.</p>
        <div className="flex justify-center gap-6">
          <span className="text-white font-bold tracking-widest text-sm hover:text-gray-300 cursor-pointer underline underline-offset-4">INSTAGRAM</span>
          <span className="text-white font-bold tracking-widest text-sm hover:text-gray-300 cursor-pointer underline underline-offset-4">X</span>
          <span className="text-white font-bold tracking-widest text-sm hover:text-gray-300 cursor-pointer underline underline-offset-4">JOURNAL</span>
        </div>
      </div>
    </div>
  );
}
