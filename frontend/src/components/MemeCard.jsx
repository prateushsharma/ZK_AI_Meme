import './MemeCard.css';
import PropTypes from 'prop-types';

function MemeCard({ meme }) {
  return (
    <div className="meme-card">
      <img src={meme.uri} alt={meme.name} />
      <div className="meme-info">
        <h3>{meme.name}</h3>
        <p>Creator: {meme.creator?.slice(0, 6)}...{meme.creator?.slice(-4)}</p>
        <p>Tips: {meme.tipsReceived} ETH</p>
      </div>
    </div>
  );
}

MemeCard.propTypes = {
  meme: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    uri: PropTypes.string,
    creator: PropTypes.string,
    tipsReceived: PropTypes.number
  }).isRequired
};

export default MemeCard;