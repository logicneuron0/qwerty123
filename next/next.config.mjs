/** @type {import('next').NextConfig} */
const nextConfig = {
   async headers() {
    return [
      {
        source: "/api/game/submit-external-score",
        headers: [
          { 
            key: "Access-Control-Allow-Origin", 
            value: "https://hiddenobjgame.vercel.app" // 🔴 REPLACE THIS
          },
          { key: "Access-Control-Allow-Methods", value: "POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
    ];
  }, 
};

export default nextConfig;
