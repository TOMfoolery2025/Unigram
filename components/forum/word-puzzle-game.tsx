/**
 * Word Puzzle Game Component
 * A simple Wordle-style game for daily challenges
 * Requirements: 4.2, 4.7
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface WordPuzzleGameProps {
  targetWord: string;
  maxAttempts?: number;
  onComplete: (score: number, attempts: number) => void;
}

type LetterStatus = 'correct' | 'present' | 'absent' | 'empty';

interface GuessLetter {
  letter: string;
  status: LetterStatus;
}

export function WordPuzzleGame({
  targetWord,
  maxAttempts = 6,
  onComplete,
}: WordPuzzleGameProps) {
  const wordLength = targetWord.length;
  const [guesses, setGuesses] = useState<GuessLetter[][]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [message, setMessage] = useState('');

  const checkGuess = (guess: string): GuessLetter[] => {
    const result: GuessLetter[] = [];
    const targetLetters = targetWord.toUpperCase().split('');
    const guessLetters = guess.toUpperCase().split('');
    const letterCounts = new Map<string, number>();

    // Count letters in target word
    targetLetters.forEach(letter => {
      letterCounts.set(letter, (letterCounts.get(letter) || 0) + 1);
    });

    // First pass: mark correct positions
    guessLetters.forEach((letter, i) => {
      if (letter === targetLetters[i]) {
        result[i] = { letter, status: 'correct' };
        letterCounts.set(letter, (letterCounts.get(letter) || 0) - 1);
      } else {
        result[i] = { letter, status: 'absent' };
      }
    });

    // Second pass: mark present letters
    guessLetters.forEach((letter, i) => {
      if (result[i].status === 'absent') {
        const count = letterCounts.get(letter) || 0;
        if (count > 0) {
          result[i] = { letter, status: 'present' };
          letterCounts.set(letter, count - 1);
        }
      }
    });

    return result;
  };

  const handleSubmit = () => {
    if (currentGuess.length !== wordLength) {
      setMessage(`Word must be ${wordLength} letters`);
      return;
    }

    const guessResult = checkGuess(currentGuess);
    const newGuesses = [...guesses, guessResult];
    setGuesses(newGuesses);
    setCurrentGuess('');
    setMessage('');

    // Check if won
    if (currentGuess.toUpperCase() === targetWord.toUpperCase()) {
      setWon(true);
      setGameOver(true);
      // Calculate score: more points for fewer attempts
      const score = Math.max(100 - (newGuesses.length - 1) * 15, 10);
      onComplete(score, newGuesses.length);
      return;
    }

    // Check if out of attempts
    if (newGuesses.length >= maxAttempts) {
      setGameOver(true);
      setMessage(`Game over! The word was ${targetWord.toUpperCase()}`);
      onComplete(0, newGuesses.length);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const getLetterColor = (status: LetterStatus): string => {
    switch (status) {
      case 'correct':
        return 'bg-green-600 text-white border-green-600';
      case 'present':
        return 'bg-yellow-600 text-white border-yellow-600';
      case 'absent':
        return 'bg-gray-600 text-white border-gray-600';
      default:
        return 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Daily Word Puzzle</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Guess the {wordLength}-letter word in {maxAttempts} tries
        </p>
      </div>

      {/* Game Board */}
      <div className="space-y-2">
        {/* Previous guesses */}
        {guesses.map((guess, i) => (
          <div key={i} className="flex gap-1">
            {guess.map((letter, j) => (
              <div
                key={j}
                className={`w-12 h-12 flex items-center justify-center text-xl font-bold border-2 rounded ${getLetterColor(
                  letter.status
                )}`}
              >
                {letter.letter}
              </div>
            ))}
          </div>
        ))}

        {/* Current guess row */}
        {!gameOver && guesses.length < maxAttempts && (
          <div className="flex gap-1">
            {Array.from({ length: wordLength }).map((_, i) => (
              <div
                key={i}
                className="w-12 h-12 flex items-center justify-center text-xl font-bold border-2 rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
              >
                {currentGuess[i]?.toUpperCase() || ''}
              </div>
            ))}
          </div>
        )}

        {/* Empty rows */}
        {Array.from({ length: maxAttempts - guesses.length - (gameOver ? 0 : 1) }).map(
          (_, i) => (
            <div key={`empty-${i}`} className="flex gap-1">
              {Array.from({ length: wordLength }).map((_, j) => (
                <div
                  key={j}
                  className="w-12 h-12 flex items-center justify-center border-2 rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* Input and Submit */}
      {!gameOver && (
        <div className="flex gap-2 w-full max-w-xs">
          <Input
            type="text"
            value={currentGuess}
            onChange={(e) =>
              setCurrentGuess(e.target.value.slice(0, wordLength).toUpperCase())
            }
            onKeyPress={handleKeyPress}
            placeholder={`Enter ${wordLength} letters`}
            maxLength={wordLength}
            className="uppercase text-center focus:ring-2 focus:ring-primary"
            autoFocus
            aria-label={`Enter your ${wordLength}-letter guess`}
          />
          <Button 
            onClick={handleSubmit} 
            disabled={currentGuess.length !== wordLength}
            className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Submit guess">
            Submit
          </Button>
        </div>
      )}

      {/* Messages */}
      {message && (
        <p
          className={`text-sm ${
            won ? 'text-green-600 font-semibold' : 'text-red-600'
          }`}
        >
          {message}
        </p>
      )}

      {won && (
        <p className="text-green-600 font-semibold">
          Congratulations! You won in {guesses.length} {guesses.length === 1 ? 'try' : 'tries'}!
        </p>
      )}

      {/* Attempts counter */}
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Attempts: {guesses.length} / {maxAttempts}
      </p>
    </div>
  );
}
