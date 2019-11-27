import React from 'react'

const canStart = ({ started, paused, running, finished, stopped }) => !started
const canPause = ({ started, paused, running, finished, stopped }) => started && (running && !finished && !stopped && !paused)
const canResume = ({ started, paused, running, finished, stopped }) => started && paused
const canStop = ({ started, paused, running, finished, stopped }) => started && (running || paused)

const LinksQueueActionButtons = ({ queue: { state: queueState }, onStartAction, onPauseAction, onResumeAction, onStopAction }) =>
  <div className={'action-buttons'}>
    <button className={'button start'}
            onClick={onStartAction}
            disabled={!canStart(queueState)}
    >
      Comenzar
    </button>
    <button className={'button pause'}
            onClick={onPauseAction}
            disabled={!canPause(queueState)}
    >
      Pausar
    </button>
    <button className={'button resume'}
            onClick={onResumeAction}
            disabled={!canResume(queueState)}
    >
      Continuar
    </button>
    <button className={'button stop'}
            onClick={onStopAction}
            disabled={!canStop(queueState)}
    >
      Finalizar
    </button>
  </div>

export default LinksQueueActionButtons
