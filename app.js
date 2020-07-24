/* globals R, $, Bacon */
Bacon.$.init($)
$(function () {
  var WORKOUT = {
    rest: 0,
    reps: 1,
    setTime: 50,
    exercises: [],
  }
  var BUTTON_STOP_TEXT = 'Click to Stop Workout'
  var BUTTON_START_TEXT = 'Click to Start Workout'
  $('<button />')
    .text(BUTTON_START_TEXT)
    .attr('id', 'startButton')
    .appendTo($('#root'))
  var timer = Bacon.interval(1000)
  var startButtonStream = $('#startButton').asEventStream('click')
  startButtonStream.onValue(function (ev) {
    var $target = $(ev.target);
    $target.text(R.test(/stop/i, $target.text()) ? BUTTON_START_TEXT : BUTTON_STOP_TEXT)
  })
  var tickProperty = Bacon.update(
    false,
    [startButtonStream, R.ifElse(R.not, R.always(0), R.always(false))],
    [timer, R.ifElse(R.is(Number), R.add(1), R.identity)]
  )
  tickProperty.filter(R.is(Number)).onValue(function (tick) {

  })
})
