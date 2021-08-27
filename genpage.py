from mako.template import Template
import datetime
from pathlib import Path
import locale

from conference import Conference


locale.setlocale(locale.LC_ALL, 'ru_RU.UTF-8')


dt = datetime.timedelta(minutes=5)
Conference.plenaryname = "Пленарные доклады"
vak = Conference.read(Path('vak'))

csstemplate = Template(filename="tt.css.mako", input_encoding='utf-8')
with open("tt.css", 'w') as page:
    page.write(csstemplate.render_unicode(
        conference = vak,
        dt = dt
    ))

htmltemplate = Template(filename="tt.html.mako", input_encoding='utf-8')
with open('tt.html', 'w') as page:
    page.write(htmltemplate.render_unicode(
        gridstyle = 'tt.css',
        visualstyle = 'visuals.css',
        dt = dt,
        conference = vak,
        scripts = 'tt.js'
    ))
