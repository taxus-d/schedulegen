/* original idea from https://css-tricks.com/building-a-conference-schedule-with-css-grid/, all eye-candy in separate file */

<%!
  from utils import track2cssgrid, time2cssgrid
  from conference import maketimes
  cssgridspecs = dict(
    auto = "auto",
    proportional = '1fr'
  )
%>

.days-button-list {
  display: grid;
  grid-gap: 0.5ex;
  grid-template-columns:\
% for day in conference.days:
1fr \
% endfor
;
}
<%def name="render_gridtime(times)">
  % for time, spec in times[:-1]:
      [${time2cssgrid(time)}] ${cssgridspecs[spec]}
  %endfor
  % if len(times) > 0:
      [${time2cssgrid(times[-1][0])}]\
  % else:
      \
  % endif
</%def>
% for day in conference.days:
<%
  times = maketimes(conference.sessions_on(day), dt)
%>
.schedule .conference-day-${loop.index} {
    display: inherit;
    grid-gap: inherit;
    grid-template-rows:
      [tracks] auto ${render_gridtime(times)};
    ## remember, labels are for grid lines, not for cells
    grid-template-columns:
      [times] 4em
      [${track2cssgrid(conference.tracks[0])}-start] 1fr
      % for i in range(len(conference.tracks)-1):
      [${track2cssgrid(conference.tracks[i])}-end ${track2cssgrid(conference.tracks[i+1])}-start] 1fr
      % endfor
      [${track2cssgrid(conference.tracks[-1])}-end];
}
% endfor


.schedule {
  display: grid;
  grid-template-rows: auto;
  grid-template-columns: auto;
}
.track-slot {
  display: block;
  padding: 10px 5px 5px;
  position: sticky;
  top: 0;
  z-index: 1000;
}
.time-slot {
  grid-column: times;
}
.time-rule {
  grid-column: 1 / -1;
}



