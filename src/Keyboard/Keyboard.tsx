import React, { useEffect } from 'react'
import styled from 'styled-components'
import { debounce } from 'lodash'
import { Letter } from '../Dwordle'
import { LetterState } from '../Board'

const KeyboardWrapper = styled.div`
  margin-right: -8px;
`

const keyboardLayout = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['Enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'Delete'],
]

const alphabet = 'abcdefghijklmnopqrstuvwxyz'
const modifiersToIgnore = ['Alt', 'Ctrl', 'Meta']

export interface KeyboardProps {
  onClick: (letter: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  enteredLetters: Letter[];
}

const getKeyColourFromLetterState = (letterState: LetterState) => {
  switch (letterState) {
    case LetterState.NotPresent:
      return 'black'
    case LetterState.Correct:
      return 'rgb(83, 141, 78)'
    case LetterState.InTheWord:
      return 'rgb(181, 159, 59)'
    default:
      return 'rgb(129, 131, 132)'
  }
}

const Keyboard = ({ onClick, onDelete, onSubmit, enteredLetters }: KeyboardProps) => {
  const processKeyDown = debounce((keyEvent: KeyboardEvent) => {
    const keyName = keyEvent.key
    const modifierPressed = modifiersToIgnore.some(modifier => keyEvent.getModifierState(modifier))
    if (modifierPressed) {
      return
    }
    if (keyName === 'Backspace') {
      onDelete()
    } else if (keyName === 'Enter') {
      onSubmit()
    } else if (alphabet.includes(keyName.toLowerCase())) {
      onClick(keyName.toLowerCase())
    }
  }, 1)

  useEffect(() => {
    document.addEventListener('keydown', processKeyDown)

    return () => {
      document.removeEventListener('keydown', processKeyDown)
    }
  }, [])
  return <KeyboardWrapper>
    {keyboardLayout.map((row, index) => (
      <KeyRow key={index} offsetRow={index === 1}>
        {row.map((key) => {
          const highestState = enteredLetters.find(letter => letter.letter === key && letter.letterState === LetterState.Correct)?.letterState ??
            enteredLetters.find(letter => letter.letter === key)?.letterState ?? LetterState.Blank
          return <Key key={key}
                      state={highestState}
                      onClick={() => {
                        const keyValue = key.toLowerCase()
                        if (keyValue === 'enter') {
                          onSubmit()
                        } else if (keyValue === 'delete') {
                          onDelete()
                        } else {
                          onClick(keyValue)
                        }
                      }}>
            {key.toUpperCase()}
          </Key>
        })}
      </KeyRow>
    ))}
  </KeyboardWrapper>
}

const KeyRow = styled.div<{ offsetRow: boolean }>`
  display: flex;
  justify-content: center;
  padding: 0 ${({ offsetRow }) => offsetRow ? '1.5rem' : 0};
  user-select: none;
`

const Key = styled.button<{ state: LetterState }>`
  border: none;
  background-color: ${({ state }) => getKeyColourFromLetterState(state)};
  height: 69px;
  width: fit-content;
  flex: 1;
  margin-right: 8px;
  margin-bottom: 8px;
  color: ${({ state }) => state === LetterState.NotPresent ? 'grey' : 'white'};
  border-radius: 6px;
  text-align: center;
  user-select: none;

  @media (max-width: 400px) {
    height: 60px;
    font-size: 10px;
    margin-right: 4px;
  }
`

export default Keyboard
