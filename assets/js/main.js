

$( document ).ready(function() {

  //sortable
  // $( "#phaseList" ).sortable({
  //   placeholder: "ui-state-highlight"
  // });
  // $( "#phaseList" ).disableSelection();

  //RubaXa/Sortable
  var sortableUl = $('#phaseList')[0];
  var sortable = Sortable.create(sortableUl);

  var timer;
  var phaseListData;
  //var remindAudio = $("#remindAudio")[0];
  var remindAudio = new Audio("assets/media/newMessage.mp3");

  //input
  $("input[type='text']").on('click', function () {
     $(this).select();
  });

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

    var phaseName = $("#phaseNameInput").val();
    var hour = $("#hourInput").val();
    var minute = $("#minuteInput").val();
    var second = $("#secondInput").val();

    phaseName = phaseName.length==1?'0'+phaseName:phaseName;
    hour = hour.length==1?'0'+hour:hour;
    minute = minute.length==1?'0'+minute:minute;
    second = second.length==1?'0'+second:second;

    $("#phaseList").append
    (
      `
        <li class="ui-state-default lu-phaseSet" id="${ new Date().getTime() }">
          <div class="mdl-grid">
            <div class="mdl-cell mdl-cell--9-col mdl-cell--5-col-tablet mdl-cell--2-col-phone lu-marginNone">
              <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                <input class="mdl-textfield__input lu-phaseTitle" type="text" id="" placeholder="Phase" value='${phaseName}'>
              </div>
            </div>
            <div class="mdl-cell mdl-cell--2-col mdl-cell--2-col-tablet mdl-cell--1-col-phone lu-marginNone lu-seperateTheUnderline">
              <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                <input class="mdl-textfield__input lu-sonToCenter lu-phaseTime" type="text" id="" placeholder="Time"  value='${hour}:${minute}:${second}'>
              </div>
            </div>
            <div class="mdl-cell mdl-cell--1-col lu-marginNone lu-sonToRight">
              <button class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored lu-clearButton">
                <i class="material-icons">clear</i>
              </button>
            </div>
          </div>
        </li>
      `
    );

    setTimeDialog.close();
    $('.lu-clearButton').click(function () {
        $(this).parents("li").remove();
    });
    $("#phaseNameInput").val("");
    $("#hourInput").val("00");
    $("#minuteInput").val("00");
    $("#secondInput").val("00");

  });
  //setTimeDialog.show();

  //timer
  // var timer = new Timer();
  timer = new Timer();
  var timerStart = false;
  var timeIsUp = false;
  //phase list
  // var phaseListData;

  //tool to extract data
  var phaseSetId;
  var phaseSetName;
  var phaseSetTime;
  var phaseSetTimeArray;
  var phaseSetTimeInSecond;
  var phaseSetTimeInSecondOverall;
  var lastOverallTime;

  $('#startButton').click(function () {
    if ($(".lu-phaseSet").length == 0)
    {
      if(timerStart == false)
      {
        timer.start();
        timerStart = true;
      }
      else
      {
        timer.pause();
        timerStart = false;
      }

    }
    else
    {
      if(timerStart == false)
      {
        //step 1
        phaseListData = new Array();
        lastOverallTime = 0;
        $( ".lu-phaseSet" ).each(function() {
          phaseSetId = $( this ).attr("id");
          phaseSetName = $( this ).find('.lu-phaseTitle').val();
          phaseSetTime = $( this ).find('.lu-phaseTime').val();
          phaseSetTimeArray = phaseSetTime.split(":");
          phaseSetTimeInSecond = Number(phaseSetTimeArray[0])*60*60  + Number(phaseSetTimeArray[1])*60 + Number(phaseSetTimeArray[2]);
          phaseSetTimeInSecondOverall = phaseSetTimeInSecond + lastOverallTime;
          lastOverallTime = phaseSetTimeInSecondOverall;
          phaseListData.push
          (
            {
              "phaseSetId": phaseSetId,
              "phaseSetTimeInSecond": phaseSetTimeInSecond,
              "phaseSetTimeInSecondOverall": phaseSetTimeInSecondOverall
            }
          );
        });

        //step 2
        timer.start({
            // precision: 'secondTenths',
            // startValues: {seconds: 90},
            // target: {seconds: 120},
            callback: function (values)
            {
              if(timer.getTotalTimeValues().seconds == phaseListData[0].phaseSetTimeInSecondOverall)
              {
                remindAudio.play();
                //console.log(timer.getTotalTimeValues());
                $("#" + phaseListData[0].phaseSetId).addClass('lu-phaseSet-timePass');

                phaseListData.splice(0, 1); //remove the first one
                if(phaseListData.length == 0)
                {
                  console.log("time Is Up");
                  //step 1: stop the timer
                  timer.pause();
                  timeIsUp = true;
                  //step 2: repeat the sound
                  remindAudio.loop = true;
                  remindAudio.play();
                  $('#startButton').addClass('timeIsUp'); //remove class anyway
                }
              }
            }
        });
        timerStart = true;
        //step 3
        $("input").attr("disabled", true);
        $("button").attr("disabled", true);
        $(".primeButton").attr("disabled", false);
      }
      else
      {
        //repeat 1
        if(timeIsUp == true)
        {
          timer.stop();
          $('#timeBoard').html("00:00:00");
          timeIsUp = false;
          timerStart = false;

          $('#startButton').removeClass('timeIsUp'); //remove class anyway
          $('.lu-phaseSet').removeClass('lu-phaseSet-timePass');
          $("input").attr("disabled", false);
          $("button").attr("disabled", false);

          if(remindAudio.played.length > 0)
          {
            remindAudio.loop = false;
            remindAudio.load();
          }
        }
        else
        {
          timer.pause();
          timerStart = false;
        }
      }
    }
  });
  $('#resetButton').click(function ()
  {
      if(timeIsUp == true || true)
      {
        timer.stop();
        $('#timeBoard').html("00:00:00");
        timeIsUp = false;
        timerStart = false;

        $('#startButton').removeClass('timeIsUp'); //remove class anyway
        $('.lu-phaseSet').removeClass('lu-phaseSet-timePass');
        $("input").attr("disabled", false);
        $("button").attr("disabled", false);

        if(remindAudio.played.length > 0)
        {
          remindAudio.loop = false;
          remindAudio.load();
        }
      }

  });
  timer.addEventListener('secondsUpdated', function (e) {
      $('#timeBoard').html(timer.getTimeValues().toString());
  });

  //button to delete 1 row
  $('.lu-clearButton').click(function () {
      $(this).parents("li").remove();
  });

  //no sleep
  //var noSleep = new NoSleep();
  //noSleep.enable();

  //button to delete 1 row
  $('.lu-clearButton').click(function () {
      $(this).parents("li").remove();
  });

  //button to delete all row
  $('#clearListButton').click(function () {
      $("#phaseList").empty();
  });

  //preset
  $('#presetMeditation').click(function () {
    $("#phaseList").empty();
    $("#phaseList").append(
      `
        <!-- example -->
        <li class="ui-state-default lu-phaseSet" id="1486019640222">
          <div class="mdl-grid">
            <div class="mdl-cell mdl-cell--9-col mdl-cell--5-col-tablet mdl-cell--2-col-phone lu-marginNone">
              <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                <input class="mdl-textfield__input lu-phaseTitle" type="text" id="" placeholder="Phase" value="Relax body">
              </div>
            </div>
            <div class="mdl-cell mdl-cell--2-col mdl-cell--2-col-tablet mdl-cell--1-col-phone lu-marginNone lu-seperateTheUnderline">
              <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                <input class="mdl-textfield__input lu-sonToCenter lu-phaseTime" type="text" id="" placeholder="Time" value="00:01:30">
              </div>
            </div>
            <div class="mdl-cell mdl-cell--1-col lu-marginNone lu-sonToRight">
              <button class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored lu-clearButton">
                <i class="material-icons">clear</i>
              </button>
            </div>
          </div>
        </li>
        <li class="ui-state-default lu-phaseSet" id="1486019640212">
          <div class="mdl-grid">
            <div class="mdl-cell mdl-cell--9-col mdl-cell--5-col-tablet mdl-cell--2-col-phone lu-marginNone">
              <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                <input class="mdl-textfield__input lu-phaseTitle" type="text" id="" placeholder="Phase" value="Imagine">
              </div>
            </div>
            <div class="mdl-cell mdl-cell--2-col mdl-cell--2-col-tablet mdl-cell--1-col-phone lu-marginNone lu-seperateTheUnderline">
              <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                <input class="mdl-textfield__input lu-sonToCenter lu-phaseTime" type="text" id="" placeholder="Time"  value="00:02:30">
              </div>
            </div>
            <div class="mdl-cell mdl-cell--1-col lu-marginNone lu-sonToRight">
              <button class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored lu-clearButton">
                <i class="material-icons">clear</i>
              </button>
            </div>
          </div>
        </li>
        <li class="ui-state-default lu-phaseSet" id="1486013240212">
          <div class="mdl-grid">
            <div class="mdl-cell mdl-cell--9-col mdl-cell--5-col-tablet mdl-cell--2-col-phone lu-marginNone">
              <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                <input class="mdl-textfield__input lu-phaseTitle" type="text" id="" placeholder="Phase" value="Silence">
              </div>
            </div>
            <div class="mdl-cell mdl-cell--2-col mdl-cell--2-col-tablet mdl-cell--1-col-phone lu-marginNone lu-seperateTheUnderline">
              <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                <input class="mdl-textfield__input lu-sonToCenter lu-phaseTime" type="text" id="" placeholder="Time"  value="00:06:00">
              </div>
            </div>
            <div class="mdl-cell mdl-cell--1-col lu-marginNone lu-sonToRight">
              <button class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored lu-clearButton">
                <i class="material-icons">clear</i>
              </button>
            </div>
          </div>
        </li>
        <li class="ui-state-default lu-phaseSet" id="1486019630212">
          <div class="mdl-grid">
            <div class="mdl-cell mdl-cell--9-col mdl-cell--5-col-tablet mdl-cell--2-col-phone lu-marginNone">
              <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                <input class="mdl-textfield__input  lu-phaseTitle" type="text" id="" placeholder="Phase" value="Be Grateful">
              </div>
            </div>
            <div class="mdl-cell mdl-cell--2-col mdl-cell--2-col-tablet mdl-cell--1-col-phone lu-marginNone lu-seperateTheUnderline">
              <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                <input class="mdl-textfield__input lu-sonToCenter lu-phaseTime" type="text" id="" placeholder="Time"  value="00:03:00">
              </div>
            </div>
            <div class="mdl-cell mdl-cell--1-col lu-marginNone lu-sonToRight">
              <button class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored lu-clearButton">
                <i class="material-icons">clear</i>
              </button>
            </div>
          </div>
        </li>
        <li class="ui-state-default lu-phaseSet" id="1486022630212">
          <div class="mdl-grid">
            <div class="mdl-cell mdl-cell--9-col mdl-cell--5-col-tablet mdl-cell--2-col-phone lu-marginNone">
              <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                <input class="mdl-textfield__input  lu-phaseTitle" type="text" id="" placeholder="Phase" value="Come Back">
              </div>
            </div>
            <div class="mdl-cell mdl-cell--2-col mdl-cell--2-col-tablet mdl-cell--1-col-phone lu-marginNone lu-seperateTheUnderline">
              <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                <input class="mdl-textfield__input lu-sonToCenter lu-phaseTime" type="text" id="" placeholder="Time"  value="00:02:00">
              </div>
            </div>
            <div class="mdl-cell mdl-cell--1-col lu-marginNone lu-sonToRight">
              <button class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored lu-clearButton">
                <i class="material-icons">clear</i>
              </button>
            </div>
          </div>
        </li>
        <!-- example -->
      `
    );
    $('.lu-clearButton').click(function () {
        $(this).parents("li").remove();
    });
  });
  $('#presetRun').click(function () {
      $("#phaseList").empty();
      $("#phaseList").append(
        `
          <!-- example -->
          <li class="ui-state-default lu-phaseSet" id="148601240222">
            <div class="mdl-grid">
              <div class="mdl-cell mdl-cell--9-col mdl-cell--5-col-tablet mdl-cell--2-col-phone lu-marginNone">
                <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                  <input class="mdl-textfield__input lu-phaseTitle" type="text" id="" placeholder="Phase" value="1st 100m">
                </div>
              </div>
              <div class="mdl-cell mdl-cell--2-col mdl-cell--2-col-tablet mdl-cell--1-col-phone lu-marginNone lu-seperateTheUnderline">
                <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                  <input class="mdl-textfield__input lu-sonToCenter lu-phaseTime" type="text" id="" placeholder="Time" value="00:00:15">
                </div>
              </div>
              <div class="mdl-cell mdl-cell--1-col lu-marginNone lu-sonToRight">
                <button class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored lu-clearButton">
                  <i class="material-icons">clear</i>
                </button>
              </div>
            </div>
          </li>
          <li class="ui-state-default lu-phaseSet" id="1486032640212">
            <div class="mdl-grid">
              <div class="mdl-cell mdl-cell--9-col mdl-cell--5-col-tablet mdl-cell--2-col-phone lu-marginNone">
                <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                  <input class="mdl-textfield__input lu-phaseTitle" type="text" id="" placeholder="Phase" value="2nd 100m">
                </div>
              </div>
              <div class="mdl-cell mdl-cell--2-col mdl-cell--2-col-tablet mdl-cell--1-col-phone lu-marginNone lu-seperateTheUnderline">
                <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                  <input class="mdl-textfield__input lu-sonToCenter lu-phaseTime" type="text" id="" placeholder="Time"  value="00:00:20">
                </div>
              </div>
              <div class="mdl-cell mdl-cell--1-col lu-marginNone lu-sonToRight">
                <button class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored lu-clearButton">
                  <i class="material-icons">clear</i>
                </button>
              </div>
            </div>
          </li>
          <li class="ui-state-default lu-phaseSet" id="1486013340212">
            <div class="mdl-grid">
              <div class="mdl-cell mdl-cell--9-col mdl-cell--5-col-tablet mdl-cell--2-col-phone lu-marginNone">
                <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                  <input class="mdl-textfield__input lu-phaseTitle" type="text" id="" placeholder="Phase" value="3rd 100m">
                </div>
              </div>
              <div class="mdl-cell mdl-cell--2-col mdl-cell--2-col-tablet mdl-cell--1-col-phone lu-marginNone lu-seperateTheUnderline">
                <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                  <input class="mdl-textfield__input lu-sonToCenter lu-phaseTime" type="text" id="" placeholder="Time"  value="00:00:20">
                </div>
              </div>
              <div class="mdl-cell mdl-cell--1-col lu-marginNone lu-sonToRight">
                <button class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored lu-clearButton">
                  <i class="material-icons">clear</i>
                </button>
              </div>
            </div>
          </li>
          <li class="ui-state-default lu-phaseSet" id="1486239630212">
            <div class="mdl-grid">
              <div class="mdl-cell mdl-cell--9-col mdl-cell--5-col-tablet mdl-cell--2-col-phone lu-marginNone">
                <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                  <input class="mdl-textfield__input  lu-phaseTitle" type="text" id="" placeholder="Phase" value="4th 100m">
                </div>
              </div>
              <div class="mdl-cell mdl-cell--2-col mdl-cell--2-col-tablet mdl-cell--1-col-phone lu-marginNone lu-seperateTheUnderline">
                <div class="mdl-textfield mdl-js-textfield lu-paddingNone">
                  <input class="mdl-textfield__input lu-sonToCenter lu-phaseTime" type="text" id="" placeholder="Time"  value="00:00:15">
                </div>
              </div>
              <div class="mdl-cell mdl-cell--1-col lu-marginNone lu-sonToRight">
                <button class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored lu-clearButton">
                  <i class="material-icons">clear</i>
                </button>
              </div>
            </div>
          </li>
          <!-- example -->
        `
      );
      $('.lu-clearButton').click(function () {
          $(this).parents("li").remove();
      });
  });

    $('#presetMeditation').click();
});
