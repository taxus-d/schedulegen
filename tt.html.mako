<%!
  from utils import time2cssgrid, track2cssgrid
  from conference import Talk, maketimes
%>
<%
  def get_colspec(e):
    if e.track.key == 'plenary':
        return '2 / -1'
    else:
        return track2cssgrid(e.track)

  def get_rowspec(e):
    return f"{time2cssgrid(e.begin)} / {time2cssgrid(e.end)}"
%>
<%def name="render_talk(t)">
  <div class="talk track-${t.track.key}" style="grid-column: ${get_colspec(t)}; grid-row: ${get_rowspec(t)};">
    <div class="talk-details">
    <h3 class="talk-title">${t.title}</h3>
		<span class="talk-presenter">${t.presenter}</span>
		<span class="talk-coauthors">${", ".join(t.coauthors)}</span>
    </div>
	</div>
</%def>
<%def name="render_event(e)">
  <div class="event track-${e.track.key}" style="grid-column: ${get_colspec(e)}; grid-row: ${get_rowspec(e)};">
    <div class="event-details">
    <h3 class="event-name">${e.name}</h3>
    </div>
	</div>
</%def>
<%def name="render_session(s)">
  % for e in s.events:
    % if isinstance(e, Talk):
      ${render_talk(e)}
    % else:
      ${render_event(e)}
    % endif
  % endfor
</%def>
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <link rel="stylesheet" href="${gridstyle}">
    <link rel="stylesheet" href="${visualstyle}">
    <script type="text/javascript" src="${scripts}" defer></script>
    <title>расписание</title>
  </head>
  <body>
  <div class="days-button-list">
  % for day in conference.days:
    <button type="button" id="button-day-${loop.index}" style="grid-column: ${loop.index+1}">
      <span class="button-label-date">${day.strftime("%d.%m.%Y")}</span>
      <span class="button-label-weekday">${day.strftime("%A")}</span>
    </button>
  % endfor 
  </div>

  <div class="schedule" aria-labelledby="schedule-heading">
% for day in conference.days:
    <div class="conference-anyday conference-day-${loop.index}">
    <h2 class="conference-current-date">${day.strftime("%d.%m.%Y (%A)")}</h2>

    ## tracks
    % for t in conference.tracks:
      <span class="track-slot" style="grid-column: track-${t.key}; grid-row: tracks;">${t.shortname}</span>
    % endfor
  
    ## timeline
    % for time in maketimes(conference.sessions_on(day), dt):
      <span class="time-slot" style="grid-row: ${time2cssgrid(time[0])};">${time[0].strftime("%H:%M")}</span>
      <span class="time-rule" style="grid-row: ${time2cssgrid(time[0])};"></span>
    % endfor
    
    % for s in conference.sessions_on(day):
    ## talks
      ${render_session(s)}
    % endfor
    </div>
% endfor 
  </div>
</body>
</html>
