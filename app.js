/* globals R, $, Bacon */
$(function () {
  // Initialize $ addons:
  Bacon.$.init($)
  $('body').flowtype()
  // Generate workout object:
  var WORKOUT = $('#workout').length === 0 ? {
    rest: 0,
    reps: 0,
    setTime: 0,
    exercises: [],
  } : JSON.parse($('#workout').text())
  // Display Constants:
  var BUTTON_STOP_TEXT = 'Click to Stop Workout'
  var BUTTON_START_TEXT = 'Click to Start Workout'
  // Generate HTML objects:
  var startButton = $('<button />')
    .text(BUTTON_START_TEXT)
    .attr('id', 'startButton')
    .addClass('fixed ma2 z-2')
    .css('top', 0)
    .css('left', 0)
    .appendTo($('#root'))
  var container = $('<div />')
    .attr('id', 'container')
    .addClass('absolute--fill tc mt2')
    .appendTo($('#root'))
  var exerciseDisplay = $('<h2 />')
    .attr('id', 'exercise')
    .addClass('b mv0')
    .css('font-size', '4em')
    .appendTo(container)
  var timerDisplay = $('<h1 />')
    .attr('id', 'timer')
    .addClass('b mv0')
    .css('font-size', '7em')
    .appendTo(container)

  // Workout constants:
  var TOTAL_WORKOUT_LENGTH = WORKOUT.exercises.length * WORKOUT.setTime * WORKOUT.reps + (WORKOUT.reps - 1) * WORKOUT.rest
  // Status constants:
  var EXERCISE = 'EXERCISE'
  var REST = 'REST'
  var DONE = 'DONE'
  // Calculate what rep, exercise, second in activity, and activity type based
  // on the current tick:
  var whereAreWe = function (tick) {
    if (tick >= TOTAL_WORKOUT_LENGTH) {
      return {
        type: DONE,
      }
    }
    // How long is unit (set + rest)?:
    var totalActionLength = WORKOUT.setTime + WORKOUT.rest
    // How many total action have been performed?:
    var totalExercises = Math.floor(tick / totalActionLength)
    // What rep are we on?:
    var repCount = Math.floor(totalExercises / WORKOUT.exercises.length)
    // Which exercise are we on in that rep?:
    var exerciseCount = totalExercises - repCount * WORKOUT.exercises.length
    // How many ticks into the action are we?:
    var count = (tick - totalActionLength * totalExercises)
    // Does that mean we are resting or exercising?:
    var status = count >= WORKOUT.setTime ? REST : EXERCISE
    // How many ticks into resting or exercising are we?
    var actionTick = (status === REST ? count - WORKOUT.setTime : count) + 1
    // Generate our action object:
    return {
      type: status,
      payload: {
        exercise: exerciseCount,
        rep: repCount,
        tick: actionTick
      },
    }
  }
  // Track when the start button is clicked:
  var startButtonStream = startButton.asEventStream('click')
  // Update button contents on click:
  startButtonStream.onValue(function () {
    startButton.text(R.test(/stop/i, startButton.text()) ? BUTTON_START_TEXT : BUTTON_STOP_TEXT)
  })
  // Start or stop the workout stream based on button click:
  Bacon.update(null,
    [startButtonStream, function (cancelStream) {
      if (typeof cancelStream === 'function') {
        // End the workout
        $(document).trigger('tick', TOTAL_WORKOUT_LENGTH)
        // Turn off the stream listener:
        cancelStream()
        return null
      }
      var workoutStream = Bacon.sequentially(1000, R.range(0, TOTAL_WORKOUT_LENGTH))
      workoutStream.onEnd(function () {
        startButton.trigger('click')
      })
      return workoutStream.onValue(function (tick) {
        $(document).trigger('tick', tick)
      })
    }]
  ).onValue(R.identity)
  // Listen for tick events, which will be emitted by the stream generated above:
  var tickStream = $(document).asEventStream('tick', R.pipe(R.nthArg(1), whereAreWe))
  // Update the clock any time type is not DONE
  tickStream
    .filter(R.pipe(R.propEq('type', DONE), R.not))
    .map(R.path(['payload', 'tick']))
    .onValue(function (tick) {
      timerDisplay.text(tick)
    })
  // Update status for when type is REST
  tickStream
    .filter(R.propEq('type', REST))
    .onValue(function () {
      exerciseDisplay.text('Resting')
    })
  // Update status with exercise name when type is EXERCISE
  tickStream
    .filter(R.propEq('type', EXERCISE))
    .map(R.path(['payload', 'exercise']))
    .map(R.nth(R.__, WORKOUT.exercises))
    .onValue(function (exercise) {
      exerciseDisplay.text(exercise)
    })
  // Clear status and timer when type is DONE
  tickStream.filter(R.propEq('type', DONE)).onValue(function () {
    exerciseDisplay.text('')
    timerDisplay.text('')
  })
})
