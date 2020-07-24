/* globals R, $, Bacon */
Bacon.$.init($)
$(function () {
  $('body').flowtype()
  var WORKOUT = $('#workout').length === 0 ? {
    rest: 0,
    reps: 1,
    setTime: 50,
    exercises: [],
  } : JSON.parse($('#workout').text())
  var BUTTON_STOP_TEXT = 'Click to Stop Workout'
  var BUTTON_START_TEXT = 'Click to Start Workout'
  $('<button />')
    .text(BUTTON_START_TEXT)
    .attr('id', 'startButton')
    .addClass('fixed ma2 z-2')
    .css('top', 0)
    .css('left', 0)
    .appendTo($('#root'))
  $('<div />')
    .attr('id', 'container')
    .addClass('absolute--fill tc')
    .appendTo($('#root'))
  $('<h2 />')
    .attr('id', 'exercise')
    .addClass('b')
    .css('font-size', '5em')
    .appendTo($('#container'))
  $('<h1 />')
    .attr('id', 'timer')
    .addClass('b')
    .css('font-size', '7em')
    .appendTo($('#container'))
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
    $('#timer').text(tick)
  })
})
