import React from 'react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import { withRouter } from "react-router";
import './index.css';

function Square(props) {
    const highlight = props.highlight ? "winning" : "";
    return (
    <button
      className={`square ${highlight}`}
      onClick={() => props.onClick()}>
      {props.value}
    </button>
    );
}

class Board extends React.Component {
  renderSquare(i, isWinningSquare) {
    return <Square
      key={i}
      value={this.props.squares[i]}
      highlight={isWinningSquare}
      onClick={() => this.props.onClick(i)}
      />;
  }

  renderRows() {
    const rows = [];
    for (let i=0; i < this.props.boardSize; i++) {
      rows.push(
        <div key={i} className="board-row">
          {this.renderCol(i)}
        </div>
      );
    }
    return rows;
  }

  renderCol(row) {
    const cols = [];
    for (let i=0; i < this.props.boardSize; i++) {
      const square = row * this.props.boardSize + i;
      const isWinningSquare = this.props.winner && this.props.winner.includes(square);
      cols.push(this.renderSquare(square, isWinningSquare));
    }
    return cols;
  }

  render() {
    return (
      <div>
        {this.renderRows()}
      </div>
    );
  }
}

class GameHistory extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isAsceningOrder: true
    };
  }

  toogleSortOrder() {
    this.setState({
      isAsceningOrder: !this.state.isAsceningOrder
    });
  }

  render() {
    let moves;
    if (this.state.isAsceningOrder) {
      moves = this.props.moves;
    } else {
      moves = [].concat(this.props.moves).reverse();
    }

    const entries = moves.map((step, move) => {
      const moveNum = this.state.isAsceningOrder ? move : this.props.moves.length - move - 1;
      const desc = step.position ?
          'Go to move #' + moveNum + ' @  (' + step.position.col + ', ' + step.position.row + ')' :
          'Go to game start';
      return (
          <li key={move}>
              <button onClick={() => this.props.jumpTo(moveNum)}
                className={moveNum === this.props.stepNumber ? 'bold' : ''}
              >
                {desc}
              </button>
          </li>
      )
    });

    return (
      <div>
        <button onClick={() => this.toogleSortOrder()}>
          Switch to {this.state.isAsceningOrder ? "Desc" : "Asc"} ordering
        </button>
        <ol>{entries}</ol>
      </div>
    )
  }
}
  
class Game extends React.Component {
  constructor(props) {
      super(props);
      this.state = {
        history: [{
            squares: Array(9).fill(null),
        }],
        stepNumber: 0,
        xIsNext: true,
      };
  }

  handleClick(i) {
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    const squares = current.squares.slice();
    if (calculateWinner(squares) || squares[i]) {
        return;
    }
    squares[i] = this.state.xIsNext ? 'X' : 'O';
    this.setState({
        history: history.concat([{
            squares: squares,
            position: {
              col: i % this.props.boardSize,
              row: Math.floor(i / this.props.boardSize)
            }
        }]),
        stepNumber: history.length,
        xIsNext: !this.state.xIsNext,
    });
  }

  jumpTo(step) {
      this.setState({
          stepNumber: step,
          xIsNext: (step % 2) === 0,
      });
  }

  render() {
      const history = this.state.history;
      const current = history[this.state.stepNumber];
      const winner = calculateWinner(current.squares);

      let status;
      if (winner) {
          status = 'Winner: ' + current.squares[winner[0]];
      } else if (this.state.stepNumber === (this.props.boardSize*this.props.boardSize)) {
          status = 'It is a draw!';
      } else {
          status = 'Next player: ' + (this.state.xIsNext ? 'X' : 'O');
      }

    return (
      <div className="game">
        <div className="game-board">
          <Board
              boardSize={this.props.boardSize}
              squares={current.squares}
              onClick={(i) => this.handleClick(i)}
              winner={winner}
          />
        </div>
        <div className="game-info">
          <div>{status}</div>
          <GameHistory 
            moves={history}
            stepNumber={this.state.stepNumber}
            jumpTo={this.jumpTo.bind(this)}
            />
        </div>
      </div>
    );
  }
}

class PlayerSelection extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: '',
      platform: 'xbox'
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handlePlatformChange = this.handlePlatformChange.bind(this);
  }

  handleSubmit(event) {
    event.preventDefault();

    this.props.onPlayerChange(this.state);
  }

  handleNameChange(event) {
    this.setState({
      name: event.target.value
    });
  }

  handlePlatformChange(event) {
    this.setState({
      platform: event.target.value
    });
  }

  render() {
    return (
      <div>
      <form onSubmit={this.handleSubmit}>
        <input
          type='text'
          name='playerName'
          id='playerName'
          onChange={this.handleNameChange}
          value={this.state.name} />
        <label htmlFor='playerName'>Player Name</label>
        <select defaultValue='xbox' id='platform' name='platform' onChange={this.handlePlatformChange}>
          <option value='kakao'>Kakao</option>
          <option value='psn'>PlayStation</option>
          <option value='steam'>Steam</option>
          <option value='xbox'>Xbox</option>
        </select>
        <label htmlFor='platform'>Platform</label>
        <input type='submit' />
      </form>
      </div>
    );
  }
}

class RecentMatches extends React.Component {
  constructor(props) {
    super(props);

    // Prevent name clash between a react router "match" and our PUBG matches...
    this.route = this.props.match;
  }

  hasPlayer() {
    return this.props.player.name.length !== 0;
  }

  getStreamingLogo(platformString) {
    switch (platformString) {
      case "mixer":
        return "<MixerLogo>";
      case "twitch":
        return "<TwitchLogo>";
      case "youtube":
        return "<YTLogo>";
      case "dlive":
        return "<DLiveLogo>";
      default:
        return "<Unknown Platform>";
    }
  }

  render() {
    if (!this.hasPlayer()) {
      return <div></div>;
    }

    const matches = this.props.matches.map((match, index) => {
      const mode = match.gameMode.includes('-fpp') ? 'FPP' : 'TPP';
      const streamingLogo = this.getStreamingLogo(match.streamingPlatform);
      const linktext = `${match.gameMode} ${mode} on ${match.mapName}: Rank: ${match.playerRank}/${match.playerCount} at ${match.createdAt} (${streamingLogo})`;
      return (
        <li key={match.id}>
          <Link to={`/matches/${this.props.player.platform}/${this.props.player.name}/${match.id}`}>{linktext}</Link>
        </li>);
    });

    const player = this.props.player.name + ' @ ' + this.props.player.platform;
    return (
      <div>
        <h2>Results for {player}</h2>
        <ol>{matches}</ol>
      </div>
    );
  }
}
const RecentMatchesWithRouter = withRouter(RecentMatches);

class Match extends React.Component {
  constructor(props) {
    super(props);
    this.matchId = this.props.match.params.matchId;
    this.player = this.props.match.params.player;
    this.platform = this.props.match.params.platform;
    
    this.state = {
      loading: true,
    }
  }

  componentDidMount() {
    const response = fakeJax({
      summary: {

      },
      events: [
        {
          type: "match_start",
          matchTimeInSeconds: 60
        },
        {
          type: "kill",
          matchTimeInSeconds: 500,
          victim: "Dude A",
          damage: {},
          clip: {
            url: "https://via.placeholder.com/150.png?text=Clip+GIF",
          }
        }
      ]
    });
    response.then((data) => {
      this.setState({loading: false, matchData: data});
    });
  }

  render() {
    const header = <h2>Match Details for {this.player}</h2>;
    if (this.state.loading) {
      return (
        <div>
          {header}
          <div>Loading Spinner....</div>
        </div>
      );
    }

    const events = this.state.matchData.events.map((event) => {
      let timeline = `${event.matchTimeInSeconds} ${event.type}`;
      let statsBox = '';
      let clipBox = '';
      if (event.type === 'kill') {
        timeline += ` ${event.victim}`;
        statsBox = <div>Damage stats go here...</div>
        clipBox = <div><img src={event.clip.url} alt=''/></div>
      }
      return (
        <div key={event.matchTimeInSeconds}>
          <span>{timeline}</span>
          {statsBox}
          {clipBox}
        </div>
      );
    });

    return (
      <div>
        {header}
        {events}
      </div>
    );
  }
}
const MatchWithRouter = withRouter(Match);

class PubgAnalyzer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      player: {
        name: '',
        platform: ''
      },
      matches: []
    };
    this.handlePlayerChange = this.handlePlayerChange.bind(this);
  }

  handlePlayerChange(player) {
    this.setState({player: player});
    this.fetchRecentMatches();
  }

  fetchRecentMatches() {
    // TODO: Exchange with real REST API
    const response = fakeJax([
          {
            id: "98118f0a-28ae-483b-8bf0-9ff6812ce922",
            /** https://github.com/pubg/api-assets/blob/master/dictionaries/gameMode.json */
            gameMode: "duo",
            createdAt: "2020-02-24T23:53:38Z",
            /** https://github.com/pubg/api-assets/blob/master/dictionaries/telemetry/mapName.json */
            mapName: "Summerland_Main",
            playerRank: 2,
            /** Derived from the number of "participants" received => this is the total number of players the game started with */
            playerCount: 99,
            /** On which platform did we detect a suitable stream recording for this match?
             * This should be based on scanning the platforms for a player with the given name,
             * and checking if they have recording that encompasses the time of the match.
             * (mixer|twitch|youtube|dlive|...) */
            streamingPlatform: "mixer",
          }
    ]);

    response.then((matches) => {
      this.setState({matches: matches});
    }, (reason) => {
      console.log("request failed", reason);
    });
  }

  render() {
    return (
      <Router>
        <Switch>
          <Route exact path='/matches/:platform/:player/:matchId' location={{state:this.state}}>
            <MatchWithRouter />
          </Route>
          <Route path='/'>
            <React.Fragment>
              <PlayerSelection onPlayerChange={this.handlePlayerChange}/>
              <RecentMatchesWithRouter player={this.state.player} matches={this.state.matches}/>
            </React.Fragment>
          </Route>
        </Switch>
      </Router>
    );
  }
}
const PubgAnalyzerWithRouter = withRouter(PubgAnalyzer);
  
// ========================================

ReactDOM.render(
  <Game boardSize="3"/>,
  document.getElementById('root')
);

ReactDOM.render(
  <Router><PubgAnalyzerWithRouter /></Router>,
  document.getElementById('matchRoot')
);

function calculateWinner(squares) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return lines[i];
        }
    }
    return null;
}

function fakeJax(data) {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      resolve(data);
    }, Math.random * 1000 + 500);
  });
}
