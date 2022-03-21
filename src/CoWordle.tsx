import React, { useEffect, useRef, useState } from 'react'
import Header from './Header'
import Board, { BoardState, getLetterState, LetterState, showAnimationLengthInSeconds } from './Board'
import Keyboard from './Keyboard/Keyboard'
import styled from 'styled-components'
import { wordsToGuess } from './words/wordsToGuess'

export const MAX_GUESSES = 6
export const WORD_LENGTH = 5

const Wrapper = styled.div`
  background-color: rgb(18, 18, 19);
  height: 100vh;
  width: 100vw;
  min-width: 350px;
  min-height: 450px;
  overflow: hidden;
`

const Content = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 1rem;
`

const KeyboardWrapper = styled.div`
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 500px;

  @media (max-width: 500px) {
    width: 95vw;
  }
`

const ErrorMessage = styled.div<{ showMessage: boolean }>`
  position: absolute;
  z-index: 1000;
  top: 50%;
  left: 50%;
  transform: translateX(-50%);
  width: 150px;
  height: 75px;
  border: 4px solid darkred;
  color: white;
  background-color: red;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  visibility: ${({ showMessage }) => showMessage ? 'visible' : 'hidden'};
`
const BoardWrapper = styled.div`
  max-width: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-width: 500px) {
    width: 100%;
    max-height: 300px;
  }
`

const _MS_PER_DAY = 1000 * 60 * 60 * 24
const cowordleEpochDate: Date = new Date('2022-03-13')

const dateDiffInDays = (date1: Date, date2: Date): number => {
  // Discard the time and time-zone information.
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate())
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate())

  return Math.floor((utc2 - utc1) / _MS_PER_DAY)
}

const getDaysSinceEpochFrom = (date: Date) => dateDiffInDays(cowordleEpochDate, date)
const today = new Date()
const daysSinceEpoch: number = getDaysSinceEpochFrom(today)
const circularIndex = (daysSinceEpoch % wordsToGuess.length + wordsToGuess.length) % wordsToGuess.length
const wordToGuess = wordsToGuess[circularIndex - 1]
console.log('word to guess: ', wordToGuess)

export interface Letter {
  letter: string,
  letterState: LetterState
}

enum GameError {
  InvalidGuess
}

const CoWordle = () => {
  const [currentGuessAttempt, setCurrentGuessAttempt] = useState(0)
  const [currentGuess, setCurrentGuess] = useState<string>('')
  const [gameError, setGameError] = useState<GameError | undefined>(undefined)
  const [stateInitialised, setStateInitialised] = useState(false)

  useEffect(() => {
    if (gameError == undefined) {
      return
    }

    setTimeout(() => setGameError(undefined), 600)
  }, [gameError])

  /**
   * These refs are needed as they can be updated from the event listeners from Keyboard
   * used to listen in on a user's key press
   */
  const currentGuessAttemptRef = useRef<number>(currentGuessAttempt)
  const currentGuessRef = useRef<string>(currentGuess)
  const boardStateRef = useRef<BoardState>(BoardState.Playing)

  const [guesses, setGuesses] = useState<string[]>([])
  const [boardState, setBoardState] = useState<BoardState>(BoardState.Playing)

  useEffect(() => {
    const localState = localStorage.getItem('state')
    setStateInitialised(true)
    if (!localState) {
      console.log('no saved state found')
      return
    }
    const savedState = JSON.parse(localState)
    setGuesses(savedState?.guesses ?? [])
    setCurrentGuessAttempt(savedState?.currentGuessAttempt ?? 0)
    currentGuessAttemptRef.current = savedState?.currentGuessAttempt ?? 0
    boardStateRef.current = savedState.boardState ?? BoardState.Playing
  }, [])

  useEffect(() => {
    if (currentGuessAttemptRef.current === MAX_GUESSES && currentGuessRef.current !== wordToGuess) {
      setBoardState(BoardState.Unsuccessful)
      boardStateRef.current = BoardState.Unsuccessful
      return
    }
    setCurrentGuess('')
    currentGuessRef.current = ''
  }, [currentGuessAttempt])

  useEffect(() => {
    const shouldIgnoreEmptyGuess = currentGuess == '' && !stateInitialised
    if (currentGuessAttempt >= MAX_GUESSES ||
      boardStateRef.current === BoardState.Successful ||
      boardStateRef.current === BoardState.Unsuccessful ||
      shouldIgnoreEmptyGuess) {
      return
    }
    setGuesses(guesses => {
      const newGuesses = [...guesses]
      newGuesses[currentGuessAttempt] = currentGuess
      return [...newGuesses]
    })
  }, [currentGuess])

  const [enteredLetters, updateEnteredLetters] = useState<Letter[]>([])

  useEffect(() => {
    const enteredLetters: Letter[] = guesses
      .map((guess) => {
        const letters = guess.split('')
        return letters.map((letter, letterIndex) => {
          return {
            letter,
            letterState: getLetterState(letter, letterIndex, wordToGuess),
          }
        })
          .filter(letter => letter.letterState !== LetterState.Blank)
      })
      .reduce((all, current) => [...all, ...current], [])
      .filter((letter, index, knownLetters) => knownLetters.findIndex(l => (l.letter === letter.letter)) === index)

    setTimeout(() => updateEnteredLetters(enteredLetters), showAnimationLengthInSeconds * 1000)
  }, [currentGuessAttempt])

  const [state, setState] = useState({})

  useEffect(() => {
    setState((state) => {
      return Object.assign(state, {
        guesses: guesses.filter(guess => !!guess),
        currentGuessAttempt: currentGuessAttemptRef.current + 1,
        boardState: boardState,
      })
    })
  }, [guesses, boardStateRef, boardState])

  const saveState = (state: any) => {
    localStorage.setItem('state', JSON.stringify(state))
  }

  const submitGuess = () => {
    if (currentGuessRef.current.length < WORD_LENGTH ||
      boardStateRef.current === BoardState.Successful ||
      boardStateRef.current === BoardState.Unsuccessful) {
      return
    }

    if (!wordsToGuess.includes(currentGuessRef.current)) {
      setGameError(GameError.InvalidGuess)
      return
    }

    if (currentGuessRef.current === wordToGuess) {
      setBoardState(BoardState.Successful)
      boardStateRef.current = BoardState.Successful
    }
    setCurrentGuessAttempt(currentGuessAttempt => {
      if (boardStateRef.current !== BoardState.Playing) {
        return currentGuessAttempt
      }
      const nextGuessAttempt = currentGuessAttempt < MAX_GUESSES ? currentGuessAttempt + 1 : currentGuessAttempt
      currentGuessAttemptRef.current = nextGuessAttempt
      return nextGuessAttempt
    })

    saveState(state)
  }


  return <Wrapper>
    <Header />
    <Content>
      <BoardWrapper>
        <Board guesses={guesses} boardState={boardState} wordToGuess={wordToGuess} />
      </BoardWrapper>
      <ErrorMessage showMessage={gameError === GameError.InvalidGuess}>
        {'Not in word list'}
      </ErrorMessage>
      <KeyboardWrapper>
        <Keyboard
          enteredLetters={enteredLetters}
          onClick={(letter) => {
            setCurrentGuess(currentGuess => {
              const newGuess = currentGuess.length < WORD_LENGTH ?
                currentGuess + letter :
                currentGuess
              currentGuessRef.current = newGuess
              return newGuess
            })
          }}
          onDelete={() => setCurrentGuess(currentGuess => {
            const newGuess = currentGuess.slice(0, -1)
            currentGuessRef.current = newGuess
            return newGuess
          })}
          onSubmit={submitGuess} />
      </KeyboardWrapper>
    </Content>
  </Wrapper>
}

export default CoWordle
