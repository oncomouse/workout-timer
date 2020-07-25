/* globals R, $, Bacon */
Bacon.$.init($)
$(function () {
  $('body').flowtype()
  var WORKOUT = $('#workout').length === 0 ? {
    rest: 0,
    reps: 0,
    setTime: 0,
    exercises: [],
  } : JSON.parse($('#workout').text())
  var BUTTON_STOP_TEXT = 'Click to Stop Workout'
  var BUTTON_START_TEXT = 'Click to Start Workout'
  var startButton = $('<button />')
    .text(BUTTON_START_TEXT)
    .attr('id', 'startButton')
    .addClass('fixed ma2 z-2')
    .css('top', 0)
    .css('left', 0)
    .appendTo($('#root'))
  var container = $('<div />')
    .attr('id', 'container')
    .addClass('absolute--fill tc')
    .appendTo($('#root'))
  var exerciseDisplay = $('<h2 />')
    .attr('id', 'exercise')
    .addClass('b')
    .css('font-size', '5em')
    .appendTo($('#container'))
  var timerDisplay = $('<h1 />')
    .attr('id', 'timer')
    .addClass('b')
    .css('font-size', '7em')
    .appendTo($('#container'))
  var startButtonStream = startButton.asEventStream('click')
  startButtonStream.onValue(function () {
    startButton.text(R.test(/stop/i, startButton.text()) ? BUTTON_START_TEXT : BUTTON_STOP_TEXT)
  })
  var totalWorkOutLength = (WORKOUT.exercises.length * WORKOUT.setTime + (WORKOUT.exercises.length - 1) * WORKOUT.rest) * WORKOUT.reps
  var EXERCISE = 'EXERCISE'
  var REST = 'REST'
  var workoutStopState = function (type, tick) {
    if (type === REST) {
      return tick + 1 > WORKOUT.rest
    }
    return tick + 1 > WORKOUT.setTime
  }
  var otherWorkoutState = function (type) {
    return type === REST ? EXERCISE : REST
  }
  var workoutSaga = R.reduce(function (workout) {
    var lastState = R.last(workout)
    if (lastState) {
      if (workoutStopState(lastState.type, lastState.payload.tick)) {
        return R.append({type: otherWorkoutState(lastState.type), payload: {tick: 1}}, workout)
      }
      return R.append({type: lastState.type, payload: {tick: lastState.payload.tick + 1}}, workout)
    }
    return [{type: EXERCISE, payload: {tick: 1}}]
  }, [], R.range(0, totalWorkOutLength))
  var runningStream = Bacon.update(null,
    [startButtonStream, function (cancelStream) {
      if (typeof cancelStream === 'function') {
        cancelStream()
        return null
      }
      var workoutStream = Bacon.sequentially(1000, workoutSaga)
      return workoutStream.onValue(function (action) {
        $(document).trigger('tick', action)
      })
    }]
  ).onValue(R.identity)
  var tickStream = $(document).asEventStream('tick', R.nthArg(1))
  tickStream.onValue(function (action) {
    timerDisplay.text(action.payload.tick)
  })
  var exerciseProperty = Bacon.update(
    0,
    [tickStream, function(exerciseCount, action) {
      if (action.type === REST) {
        return exerciseCount + 1
      }
      return exerciseCount
    }])
  exerciseProperty.merge(runningStream).onValue(function() {
    console.log(arguments)
    // exerciseDisplay.text(WORKOUT.exercises[exerciseCount])
  })
})
