import React from 'react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import { withRouter } from "react-router";
import Hls from 'hls.js';
import './index.css';

const BACKEND_URL = "http://localhost:8080";

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

  fetchClips() {
    window.fetch(`${BACKEND_URL}/clips/${this.platform}/${this.player}/${this.matchId}`)
      .then((response) => {
        if (response.ok !== false) {
          return response.json();
        }
      })
      .then((data) => {
        this.setState(prevState => {
          let matchData = Object.assign({}, prevState.matchData);
          matchData.clips = data;
          return { matchData };
        });
      });
  }

  componentDidMount() {
    window.fetch(`${BACKEND_URL}/matches/${this.platform}/${this.player}/${this.matchId}`)
      .then((response) => {
        if (response.ok !== false) {
          return response.json();
        }
      })
      .then((data) => {
        this.setState({loading: false, matchData: data});

        // TODO: Handle cases where clips are in NOT_FOUND state
        const hasPending = c => c.map(a => a.state).reduce((a,b) => a || b === "PENDING", false);
        if (hasPending(data.clips)) {
          const id = setInterval(() => {
            this.fetchClips();

            if (!hasPending(this.state.matchData.clips)) {
              clearInterval(id);
            }
          }, 1000);
        }
      });
    /*{
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
    }*/
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

    const clips = this.state.matchData.clips.map((clip) => {
      if (clip.state !== "AVAILABLE") {
        return "";
      }
      return (
        <div>
          <div><button type="button">Connect with previous event</button><button type="button">-5s</button><button type="button">Reset</button></div>
          <MyHlsPlayer class="clip-player" src={`${BACKEND_URL}${clip.url}`}>No video support. :-(</MyHlsPlayer>
          <div><button type="button">Connect with next event</button><button type="button">+5s</button><button type="button">Reset</button></div>
        </div>
      )
    });

    const events = this.state.matchData.events.map((event, index) => {
      let timeline = `${event.timestamp} ${event['@type']}`;
      let statsBox = '';
      if (event['@type'].includes('Kill')) {
        timeline += ` ${event.victim}`;
        statsBox = <div>Damage stats go here...</div>
      }
      return (
        <div key={event.timestamp}>
          <span>{timeline}</span>
          {statsBox}{clips[index]}
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

class MyHlsPlayer extends React.Component {
  constructor(props) {
    super(props);
    this.hls = new Hls({
      startPosition: 1024
    });
    this.player = null;
    console.log("Player!");
  }

  componentDidMount() {
    if (Hls.isSupported && this.player) {
      this.hls.attachMedia(this.player);
      this.hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log("Yay!");
        this.hls.loadSource("https://vodcontent-2003.xboxlive.com/channel-47094669-public/a9ac4879-3ab2-4d32-a32c-1176c6e00ff4/manifest.m3u8");
        this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          console.log("manifest loaded, found " + data.levels.length + " quality level");
        });
      });
    }
  }

  render() {
    return <video ref={player => this.player = player}></video>
  }
}

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
    this.setState({player: player}, this.fetchRecentMatches.bind(this));
  }

  fetchRecentMatches() {
    const { name, platform } = this.state.player;
    window.fetch(`${BACKEND_URL}/matches/${platform}/${name}`)
      .then((response) => {
        if (response.ok !== false) {
          return response.json();
        }
      })
      .then((data) => {
          this.setState({matches: data});
      });
          /*{
            id: "98118f0a-28ae-483b-8bf0-9ff6812ce922",
            // https://github.com/pubg/api-assets/blob/master/dictionaries/gameMode.json
            gameMode: "duo",
            createdAt: "2020-02-24T23:53:38Z",
            // https://github.com/pubg/api-assets/blob/master/dictionaries/telemetry/mapName.json
            mapName: "Summerland_Main",
            playerRank: 2,
            // Derived from the number of "participants" received => this is the total number of players the game started with
            playerCount: 99,
            // On which platform did we detect a suitable stream recording for this match?
            // This should be based on scanning the platforms for a player with the given name,
            // and checking if they have recording that encompasses the time of the match.
            // (mixer|twitch|youtube|dlive|...)
            streamingPlatform: "mixer",
          }*/
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
  <Router><PubgAnalyzerWithRouter /></Router>,
  document.getElementById('root')
);
