import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

function Square(props) {
    return (
    <button className="square" onClick={() => props.onClick()}>
        {props.value}
    </button>
    );
}
  
class Board extends React.Component {
  renderSquare(i) {
    return <Square
      key={i}
      value={this.props.squares[i]}
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
      cols.push(this.renderSquare(row * this.props.boardSize + i));
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
          status = 'Winner: ' + winner;
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
  
// ========================================

ReactDOM.render(
  <Game boardSize="3"/>,
  document.getElementById('root')
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
            return squares[a];
        }
    }
    return null;
}