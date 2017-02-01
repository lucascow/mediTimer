var timer;
$( document ).ready(function() {
  //input
  $("input[type='text']").click(function () {
     $(this).select();
  });

  //sortable
  $( "#sortable" ).sortable({
    placeholder: "ui-state-highlight"
  });
  $( "#sortable" ).disableSelection();

  //dialog
  var setTimeDialog = $("#setTimeDialog")[0];
  var showDialogButton = $("#showDialogButton");
  var closeDialogButton = $("#closeDialogButton");
  if (! setTimeDialog.showModal) {
    dialogPolyfill.registerDialog(setTimeDialog);
  }
  $("#showDialogButton").on("click", function(){
    setTimeDialog.show();
  });
  $("#closeDialogButton").on("click", function(){
    setTimeDialog.close();
  });
  $("#confirmDialogButton").on("click", function(){
    setTimeDialog.close();
  });
  // setTimeDialog.show();

  //timer
  var timer = new Timer();
  // timer = new Timer();
  $('#startButton').click(function () {
      timer.start({
          // precision: 'secondTenths',
          // startValues: {seconds: 90},
          // target: {seconds: 120},
          callback: function (values)
          {
            if(values.seconds === 3)
            {
              console.log(values);
              // console.log(timer.getTimeValues());
              // console.log(timer.getTotalTimeValues());
              console.log("It is 3 sec now!")
            }
          }
      });
  });
  $('#pauseButton').click(function () {
      timer.pause();
  });
  $('#stopButton').click(function () {
      timer.stop();
  });
  timer.addEventListener('secondsUpdated', function (e) {
      $('#timeBoard').html(timer.getTimeValues().toString());
  });

  //delete button
  $('.lu-clearButton').click(function () {
      $(this).parents("li").remove();
  });

  //after confirm
  // var phaseName = "Phase One";
  // var hour = "00";
  // var minute = "00";
  // var second = "00";
  // $("#sortable").append
  // (
  //   `
  //     <li>
  //       <h3 class="lu-timeBoard">
  //         ${phaseName} - ${hour}::${minute}::${second}
  //       </h3>
  //     </li>
  //   `
  // );

});
