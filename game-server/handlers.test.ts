import { GameHandlers, NewCardPlayed, CardPlayed, Suit, Player, Card } from './handlers';
import { describe, it } from 'node:test';
import assert from 'node:assert';


const PLAYER_1 = { name: '1'};
const PLAYER_2 = { name: '2'};
const PLAYER_3 = { name: '3'};
const PLAYER_4 = { name: '4'};

describe('findWinningCard', () => {
  it('should return the joker over trump or high card', () => {
  
    const card_1 = { faceValue: 7, suit:  Suit.DIAMOND, };
    const card_2 ={ faceValue: 3, suit: Suit.HEART };
    const card_3 = { faceValue: 1, suit: Suit.JOKER };

    const cardsPlayed: CardPlayed[] = [
      { 
        card: card_1 as Card, player: PLAYER_1 as Player,
      },
      { 
        card: card_2 as Card, player: PLAYER_2 as Player,
      },
      { 
        card: card_3 as Card, player: PLAYER_3 as Player,
      },
    ];

    const handlers = new GameHandlers();
    handlers.cardsPlayed = cardsPlayed;
    handlers.trumpSuit = Suit.HEART;

    const winningCard = handlers.findWinningCard(cardsPlayed);

    assert.strictEqual(winningCard, cardsPlayed[2]);
  });

  it( 'should return red joker over black joker', () => {
    const card_1 = { faceValue: 7, suit:  Suit.DIAMOND, };
    const card_2 ={ faceValue: 3, suit: Suit.HEART };
    const card_3 = { faceValue: 2, suit: Suit.JOKER };
    const card_4 = { faceValue: 1, suit: Suit.JOKER };

    const cardsPlayed: CardPlayed[] = [
      { 
        card: card_1 as Card, player: PLAYER_1 as Player,
      },
      { 
        card: card_2 as Card, player: PLAYER_2 as Player,
      },
      { 
        card: card_3 as Card, player: PLAYER_3 as Player,
      },
      { 
        card: card_4 as Card, player: PLAYER_4 as Player,
      },
    ];

    const handlers = new GameHandlers();
    handlers.cardsPlayed = cardsPlayed;
    handlers.trumpSuit = Suit.HEART;

    const winningCard = handlers.findWinningCard(cardsPlayed);

    assert.strictEqual(winningCard, cardsPlayed[2]);
  });

  it('should return the highest card of the same suit when no joker is played', () => {
    const card_1 = { faceValue: 7, suit:  Suit.HEART, };
    const card_2 ={ faceValue: 3, suit: Suit.HEART };
    const card_3 = { faceValue: 1, suit: Suit.HEART };

    const cardsPlayed: CardPlayed[] = [
      { 
        card: card_1 as Card, player: PLAYER_1 as Player,
      },
      { 
        card: card_2 as Card, player: PLAYER_2 as Player,
      },
      { 
        card: card_3 as Card, player: PLAYER_3 as Player,
      },
    ];

    const handlers = new GameHandlers();
    handlers.cardsPlayed = cardsPlayed;
    handlers.trumpSuit = Suit.HEART;

    const winningCard = handlers.findWinningCard(cardsPlayed);

    assert.strictEqual(winningCard, cardsPlayed[0]);
  });

  it('should return the highest trump card when no joker is played', () => {
    const card_1 = { faceValue: 1, suit:  Suit.HEART, };
    const card_2 ={ faceValue: 3, suit: Suit.HEART };
    const card_3 = { faceValue: 7, suit: Suit.DIAMOND };

    const cardsPlayed: CardPlayed[] = [
      { 
        card: card_1 as Card, player: PLAYER_1 as Player,
      },
      { 
        card: card_2 as Card, player: PLAYER_2 as Player,
      },
      { 
        card: card_3 as Card, player: PLAYER_3 as Player,
      },
    ];

    const handlers = new GameHandlers();
    handlers.cardsPlayed = cardsPlayed;
    handlers.trumpSuit = Suit.HEART;

    const winningCard = handlers.findWinningCard(cardsPlayed);

    assert.strictEqual(winningCard, cardsPlayed[1]);
  });

  it('should return the first card if none of the other cards are of the same suit nor trump', () => {
    const card_1 = { faceValue: 1, suit:  Suit.HEART, };
    const card_2 ={ faceValue: 3, suit: Suit.CLUB };
    const card_3 = { faceValue: 7, suit: Suit.DIAMOND };

    const cardsPlayed: CardPlayed[] = [
      { 
        card: card_1 as Card, player: PLAYER_1 as Player,
      },
      { 
        card: card_2 as Card, player: PLAYER_2 as Player,
      },
      { 
        card: card_3 as Card, player: PLAYER_3 as Player,
      },
    ];

    const handlers = new GameHandlers();
    handlers.cardsPlayed = cardsPlayed;
    handlers.trumpSuit = Suit.SPADE;

    const winningCard = handlers.findWinningCard(cardsPlayed);

    assert.strictEqual(winningCard, cardsPlayed[0]);
  });
});