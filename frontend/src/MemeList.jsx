import meme1 from "./generated_images/artificial_intelligence_neural_network_20250214_043404.png";
import meme2 from "./generated_images/black_hole_formation_visualization_20250214_051435.png";


const memes = [
  { name: "Meme 1", uri: meme1, proofHash: "0x972d4bb4b71f77e8fe669f834b661fa62ff88b1cd08fcbfe87d82d707fbda5db", creator: "0xAbc...1234", tipsReceived: "0.01 ETH" },
  { name: "Meme 2", uri: meme2, proofHash: "0x0f7d84ec32a9a9a898de4df23acbf6af1ece4d5f9fce57b31a6b95912f2e4399", creator: "0xDef...5678", tipsReceived: "0.02 ETH" }
];

const MemeList = () => {
  return (
    <div className="meme-container">
      <h2 className="meme-title">📸 Stored Memes</h2>

      {memes.length === 0 ? (
        <p className="no-memes">No memes found.</p>
      ) : (
        <div className="meme-grid">
          {memes.map((meme, index) => (
            <div key={index} className="meme-card">
              <h3 className="meme-name">{meme.name}</h3>
              <img src={meme.uri} alt={meme.name} className="meme-image" />
              <p className="meme-hash">🆔 {meme.proofHash}</p>
              <p className="meme-creator">👤 Creator: <span>{meme.creator}</span></p>
              <p className="meme-tips">💰 Tips: {meme.tipsReceived}</p>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .meme-container {
          padding: 24px;
          background-color: #111827;
          min-height: 100vh;
          color: white;
        }

        .meme-title {
          font-size: 2rem;
          font-weight: bold;
          text-align: center;
          margin-bottom: 24px;
        }

        .no-memes {
          text-align: center;
          color: #9CA3AF;
        }

        .meme-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        @media (min-width: 640px) {
          .meme-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 768px) {
          .meme-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .meme-card {
          background-color: #1F2937;
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .meme-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 15px rgba(0, 0, 0, 0.2);
        }

        .meme-name {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .meme-image {
          width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 8px 0;
        }

        .meme-hash {
          color: #9CA3AF;
          font-size: 0.875rem;
          margin: 8px 0;
          word-break: break-all;
        }

        .meme-creator {
          margin: 12px 0;
          color: #D1D5DB;
        }

        .meme-creator span {
          color: #34D399;
        }

        .meme-tips {
          color: #FBBF24;
          font-weight: 600;
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
};

export default MemeList;