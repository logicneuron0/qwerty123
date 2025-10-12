'use client';
import { useEffect, useState } from 'react';

export default function BhangarhLauncher() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user data from your existing auth/me endpoint
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        
        if (data.loggedIn && data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const launchBhangarh = () => {
    if (!user) {
      alert('Please log in to play and save your progress!');
      return;
    }

    // Encode user data to pass safely
    const userData = btoa(JSON.stringify({
      userId: user.id,
      username: user.username
    }));

    // 🔴 REPLACE WITH YOUR ACTUAL BHANGARH GAME URL
    window.location.href = `https://hiddenobjgame.vercel.app/?data=${userData}`;
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-[url('/images/background3.jpg')] bg-cover bg-center bg-fixed text-gray-200 font-sans px-4 py-10" style={{ fontFamily: "'Simbiot', monospace" }}>
      <h1 className="font-bold text-6xl md:text-7xl mb-10 text-center bg-gradient-to-b from-[#C10000] to-[#8A0303] bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(193,0,0,0.6)]"
        style={{ fontFamily: "'Death Markers Drip', cursive", letterSpacing: '6px' }}>
        Shadows of Bhangarh
      </h1>
      
      <p style={{ fontSize: '1.2rem', marginBottom: '30px', color: '#fff' }}>
        Explore the haunted fortress of Bhangarh. Find cursed artifacts in each room before time runs out!
      </p>

      {user && (
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.5)', 
          padding: '20px', 
          borderRadius: '10px',
          marginBottom: '30px',
          color: "black"
        }}>
          <p >
            <strong>Player:</strong> {user.username}
          </p>
        </div>
      )}

      <button
        onClick={launchBhangarh}
        className="bg-[#880000] mb-10 border-2 border-[#ff0000] text-white px-6 py-5 rounded-lg text-xl font-semibold tracking-widest transition-all duration-300 hover:bg-[#ff0000] hover:scale-105 shadow-[0_8px_20px_rgba(255,0,0,0.5)]"
    
        onMouseOver={(e) => {
          e.target.style.transform = 'translateY(-5px)';
          e.target.style.boxShadow = '0 12px 30px rgba(255, 0, 0, 0.6)';
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 8px 20px rgba(255, 0, 0, 0.4)';
        }}
      >
        Enter Bhangarh Fort
      </button>

      <div className="bg-black/70 border-2 border-[#5a0000] rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.7)] backdrop-blur-sm p-6 w-full max-w-2xl mb-8">
        <h3 className="text-xl font-semibold text-[#ff4d4d] mb-4">Game Instructions:</h3>
        <ul style={{ lineHeight: '2', color: '#fff' }}>
          <li>🎯 4 haunted rooms to explore</li>
          <li>⏱️ 5 minutes per room</li>
          <li>👻 Find cursed artifacts before time runs out</li>
          {/* <li>💀 Beware of jump scares!</li> */}
          <li>✅ +10 for selecting correct objects</li>
          <li>❌ -2 for selecting wrong objects</li>
        </ul>
      </div>
    </div>
  );
}