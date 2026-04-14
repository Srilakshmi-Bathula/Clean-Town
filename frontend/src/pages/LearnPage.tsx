import { useState } from 'react';
import { 
  Trash2, 
  Apple, 
  Zap, 
  CheckCircle, 
  Lightbulb, 
  HelpCircle, 
  ChevronRight,
  Info
} from 'lucide-react';

const LearnPage = () => {
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const categories = [
    {
      id: 'dry',
      title: 'Dry Waste',
      examples: 'Plastic, Paper, Metal',
      icon: <Trash2 size={24} color="#138808" />,
      points: ['Separate from wet waste', 'Ensure items are clean/dry', 'Commonly recyclable'],
      color: '#DCFCE7'
    },
    {
      id: 'wet',
      title: 'Wet Waste',
      examples: 'Food, Organic waste',
      icon: <Apple size={24} color="#FF9933" />,
      points: ['Kitchen & food scraps', 'Compostable materials', 'Highly biodegradable'],
      color: '#FFEDD5'
    },
    {
      id: 'hazard',
      title: 'Hazardous Waste',
      examples: 'Batteries, Chemicals',
      icon: <Zap size={24} color="#E63946" />,
      points: ['Harmful if mismanaged', 'Electronic waste', 'Requires special handling'],
      color: '#FEE2E2'
    }
  ];

  const tips = [
    "Separate wet and dry waste at home",
    "Do not burn waste - it causes air pollution",
    "Use Eco-Swap instead of throwing reusable items"
  ];

  const suggestions = [
    { item: 'Plastic item?', action: 'Recycle or reuse' },
    { item: 'Old books?', action: 'List in Eco-Swap' },
    { item: 'Food waste?', action: 'Compost at home' }
  ];

  const handleQuiz = (choice: string) => {
    setQuizAnswer(choice);
    setShowResult(true);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>Learn Waste Management</h1>
        <p style={{ color: '#6B7280', fontSize: '1.2rem' }}>Simple steps to keep your city clean</p>
      </header>

      {/* Waste Categories */}
      <section style={{ marginBottom: '4rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {categories.map((cat) => (
            <div key={cat.id} className="card" style={{ padding: '2rem', textAlign: 'center', borderTop: `6px solid ${cat.icon.props.color}` }}>
              <div style={{ background: cat.color, width: '60px', height: '60px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                {cat.icon}
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--accent-blue)' }}>{cat.title}</h3>
              <p style={{ fontWeight: '600', color: '#6B7280', marginBottom: '1rem', fontSize: '0.9rem' }}>e.g. {cat.examples}</p>
              <ul style={{ textAlign: 'left', listStyle: 'none', padding: 0, fontSize: '1rem', color: '#4B5563' }}>
                {cat.points.map((p, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: '6px', height: '6px', background: cat.icon.props.color, borderRadius: '50%' }}></div>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="grid-2">
        {/* Quick Tips */}
        <section className="card" style={{ padding: '2rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--accent-blue)' }}>
            <CheckCircle color="var(--primary-green)" /> Quick Tips
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1rem', background: '#F9FAFB', borderRadius: '12px' }}>
                <span style={{ background: 'var(--primary-green)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.8rem', fontWeight: 'bold' }}>{i+1}</span>
                <p style={{ margin: 0, color: '#4B5563' }}>{tip}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Smart Suggestions */}
        <section className="card" style={{ padding: '2rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--accent-blue)' }}>
            <Lightbulb color="var(--primary-saffron)" /> Smart Suggestions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {suggestions.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px dashed #D1D5DB', borderRadius: '12px' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--accent-blue)' }}>{s.item}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-green)', fontWeight: '600' }}>
                  <ChevronRight size={18} /> {s.action}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Mini Quiz */}
      <section className="card" style={{ marginTop: '2rem', padding: '2.5rem', background: 'var(--accent-blue)', color: 'white' }}>
        <div style={{ textAlign: 'center' }}>
          <HelpCircle size={48} color="var(--primary-saffron)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Quick Challenge</h2>
          <p style={{ color: '#9CA3AF', marginBottom: '2rem' }}>Test your knowledge in seconds!</p>
          
          <div className="card" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Where does a plastic water bottle go?</h3>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                className="btn-green" 
                style={{ padding: '0.75rem 2rem' }}
                onClick={() => handleQuiz('Dry Waste')}
              >
                Dry Waste
              </button>
              <button 
                className="btn-saffron" 
                style={{ padding: '0.75rem 2rem' }}
                onClick={() => handleQuiz('Wet Waste')}
              >
                Wet Waste
              </button>
            </div>
          </div>

          {showResult && (
            <div style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '12px', background: quizAnswer === 'Dry Waste' ? 'rgba(19, 136, 8, 0.2)' : 'rgba(230, 57, 70, 0.2)', border: `1px solid ${quizAnswer === 'Dry Waste' ? 'var(--primary-green)' : 'var(--danger-red)'}`, display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
              <Info />
              <span>
                {quizAnswer === 'Dry Waste' 
                  ? "Correct! Plastic is dry waste and should be recycled." 
                  : "Not quite. Plastic is dry waste. Food scraps are wet waste."}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Animal Safety (Cow-Safe) Section */}
      <section className="card" style={{ marginTop: '2rem', padding: '2.5rem', borderLeft: '8px solid #EA580C', background: '#FFF7ED' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
          <div style={{ background: '#FFEDD5', width: '80px', height: '80px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '2.5rem' }}>🐄</span>
          </div>
          <div>
            <h2 style={{ fontSize: '1.75rem', color: '#9A3412', marginBottom: '0.75rem' }}>Cow-Safe: Protecting Our Animals</h2>
            <p style={{ color: '#7C2D12', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Every year, thousands of street animals like cows consume plastic waste, which can be fatal. Our "Cow-Safe" system helps flag hazardous reports to prioritize their cleanup.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #FFEDD5' }}>
                <h4 style={{ color: '#9A3412', marginBottom: '0.5rem' }}>🛑 No Plastic Bags</h4>
                <p style={{ fontSize: '0.875rem', color: '#7C2D12' }}>Cows often eat plastic bags while trying to get to food scraps inside.</p>
              </div>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #FFEDD5' }}>
                <h4 style={{ color: '#9A3412', marginBottom: '0.5rem' }}>⚠️ Sharp Objects</h4>
                <p style={{ fontSize: '0.875rem', color: '#7C2D12' }}>Glass and metal can cause internal injuries. Dispose of them in sealed containers.</p>
              </div>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #FFEDD5' }}>
                <h4 style={{ color: '#9A3412', marginBottom: '0.5rem' }}>📦 Wrap It Up</h4>
                <p style={{ fontSize: '0.875rem', color: '#7C2D12' }}>If you must discard food, wrap it in paper or eco-friendly alternatives.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section style={{ marginTop: '4rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '2rem', color: 'var(--accent-blue)', textAlign: 'center' }}>Featured Video Guides</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div className="card" style={{ padding: '1rem', overflow: 'hidden' }}>
            <div style={{ position: 'relative', paddingTop: '56.25%', marginBottom: '1rem' }}>
              <iframe 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '12px' }}
                src="https://www.youtube.com/embed/g8Sst6f69-E" 
                title="Waste Segregation Guide"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
            <h4 style={{ color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>Waste Segregation 101</h4>
            <p style={{ fontSize: '0.9rem', color: '#6B7280' }}>Learn the fundamentals of separating waste at the source.</p>
          </div>

          <div className="card" style={{ padding: '1rem', overflow: 'hidden' }}>
            <div style={{ position: 'relative', paddingTop: '56.25%', marginBottom: '1rem' }}>
              <iframe 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '12px' }}
                src="https://www.youtube.com/embed/Q5s4n9S_9S0" 
                title="Home Composting"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
            <h4 style={{ color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>How to Compost at Home</h4>
            <p style={{ fontSize: '0.9rem', color: '#6B7280' }}>Turn your kitchen scraps into nutrient-rich soil.</p>
          </div>

          <div className="card" style={{ padding: '1rem', overflow: 'hidden' }}>
            <div style={{ position: 'relative', paddingTop: '56.25%', marginBottom: '1rem' }}>
              <iframe 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '12px' }}
                src="https://www.youtube.com/embed/6jQ7y_qQYUA" 
                title="Plastic Recycling"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
            <h4 style={{ color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>The Journey of Recycling</h4>
            <p style={{ fontSize: '0.9rem', color: '#6B7280' }}>Understand what happens to your waste after you bin it.</p>
          </div>

          <div className="card" style={{ padding: '1rem', overflow: 'hidden' }}>
            <div style={{ position: 'relative', paddingTop: '56.25%', marginBottom: '1rem' }}>
              <iframe 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '12px' }}
                src="https://www.youtube.com/embed/OasbYWF4_S8" 
                title="Zero Waste Living"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
            <h4 style={{ color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>Zero Waste Living Tips</h4>
            <p style={{ fontSize: '0.9rem', color: '#6B7280' }}>Small changes you can make to reduce your daily footprint.</p>
          </div>

          <div className="card" style={{ padding: '1rem', overflow: 'hidden' }}>
            <div style={{ position: 'relative', paddingTop: '56.25%', marginBottom: '1rem' }}>
              <iframe 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '12px' }}
                src="https://www.youtube.com/embed/1BCA8xInPUM" 
                title="Upcycling Ideas"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
            <h4 style={{ color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>Creative Upcycling DIY</h4>
            <p style={{ fontSize: '0.9rem', color: '#6B7280' }}>Learn how to turn "trash" into beautiful home decor.</p>
          </div>

          <div className="card" style={{ padding: '1rem', overflow: 'hidden' }}>
            <div style={{ position: 'relative', paddingTop: '56.25%', marginBottom: '1rem' }}>
              <iframe 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '12px' }}
                src="https://www.youtube.com/embed/ju_2nuK5O-E" 
                title="Ocean Plastic"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
            <h4 style={{ color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>Our Planet's Plastic Problem</h4>
            <p style={{ fontSize: '0.9rem', color: '#6B7280' }}>A short documentary on how waste affects our oceans.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LearnPage;
