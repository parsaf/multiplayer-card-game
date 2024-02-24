import { findWinningCard } from './handlers';

describe('findWinningCard', () => {
  it('should return the winning card when the first card is a joker', () => {
    const cardsPlayed = [
      { card: { faceValue: 5, suit: 'JOKER' } },
      { card: { faceValue: 3, suit: 'HEARTS' } },
      { card: { faceValue: 7, suit: 'DIAMONDS' } },
    ];

    const winningCard = findWinningCard(cardsPlayed);

    expect(winningCard).toEqual({ card: { faceValue: 5, suit: 'JOKER' } });
  });

  it('should return the highest card of the same suit when no joker is played', () => {
    const cardsPlayed = [
      { card: { faceValue: 5, suit: 'HEARTS' } },
      { card: { faceValue: 3, suit: 'HEARTS' } },
      { card: { faceValue: 7, suit: 'DIAMONDS' } },
    ];

    const winningCard = findWinningCard(cardsPlayed);

    expect(winningCard).toEqual({ card: { faceValue: 5, suit: 'HEARTS' } });
  });

  it('should return the highest trump card when no joker or same suit card is played', () => {
    const cardsPlayed = [
      { card: { faceValue: 5, suit: 'DIAMONDS' } },
      { card: { faceValue: 3, suit: 'HEARTS' } },
      { card: { faceValue: 7, suit: 'DIAMONDS' } },
    ];

    const winningCard = findWinningCard(cardsPlayed);

    expect(winningCard).toEqual({ card: { faceValue: 7, suit: 'DIAMONDS' } });
  });

  it('should return the first card as the winning card when all cards are jokers', () => {
    const cardsPlayed = [
      { card: { faceValue: 5, suit: 'JOKER' } },
      { card: { faceValue: 3, suit: 'JOKER' } },
      { card: { faceValue: 7, suit: 'JOKER' } },
    ];

    const winningCard = findWinningCard(cardsPlayed);

    expect(winningCard).toEqual({ card: { faceValue: 5, suit: 'JOKER' } });
  });
});